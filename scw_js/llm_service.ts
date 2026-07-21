import { getContract, createPublicClient, createWalletClient, http } from "viem";
import { getChain, getLLMv1ContractConfig } from "./getChain.js";
import { loadPrivateKey, getRpcUrl, toCAIP2 } from "@fretchen/chain-utils";
import { getS3Object, putS3Object } from "@fretchen/s3-utils";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { privateKeyToAccount } from "viem/accounts";
import pino from "pino";

const MERKLE_TREE_FILE = "merkle/trees.json";
const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

interface LLMProviderConfig {
  displayName: string; // for error messages/logs — e.g. "Could not reach IONOS: ..."
  baseUrl: string; // no trailing "/chat/completions" — appended at call time
  defaultModel: string;
  apiKeyEnvVar: string;
  // Price per 1,000,000 tokens, num/den to stay exact bigint math. USD for mistral;
  // EUR for ionos (see convertTokensToUsdcCost's doc comment on the EUR/USDC simplification).
  inputPricePerMillion: { num: bigint; den: bigint };
  outputPricePerMillion: { num: bigint; den: bigint };
}

const LLM_PROVIDERS: Record<string, LLMProviderConfig> = {
  ionos: {
    displayName: "IONOS",
    baseUrl: "https://openai.inference.de-txl.ionos.com/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    apiKeyEnvVar: "IONOS_API_TOKEN",
    inputPricePerMillion: { num: 71n, den: 100n },
    outputPricePerMillion: { num: 71n, den: 100n }, // blended rate, unchanged — legacy sc_llm.ts path
  },
  mistral: {
    displayName: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
    apiKeyEnvVar: "MISTRAL_API_KEY",
    // Mistral Large 3, mistral.ai/pricing/api (fetched 2026-07-21) — re-verify before any
    // mainnet cutover; Mistral has repriced materially before.
    inputPricePerMillion: { num: 50n, den: 100n },
    outputPricePerMillion: { num: 150n, den: 100n },
  },
};

function getLLMProviderConfig(provider: string): LLMProviderConfig {
  const config = LLM_PROVIDERS[provider];
  if (!config) {
    throw new Error(
      `Unknown LLM provider: ${provider}. Valid providers: ${Object.keys(LLM_PROVIDERS).join(", ")}`,
    );
  }
  return config;
}

export interface LLMMessage {
  role: string;
  content: string;
}

interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export async function callLLMAPI(
  prompt: LLMMessage[],
  dummy = false,
  provider = "ionos",
): Promise<LLMResponse> {
  if (dummy) {
    return {
      content: "I am a placeholder for the LLM response",
      usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 15 },
      model: "placeholder model",
    };
  }
  const config = getLLMProviderConfig(provider);
  const apiToken = process.env[config.apiKeyEnvVar];
  logger.info({ provider }, "Work with real API");
  if (!apiToken) {
    throw new Error(
      `API token not found. Please configure the ${config.apiKeyEnvVar} environment variable.`,
    );
  }

  if (!prompt || !prompt.length) {
    throw new Error("No prompt provided.");
  }
  logger.debug({ prompt }, "Generating answer for prompt");

  const body = { model: config.defaultModel, messages: prompt };

  logger.debug("Sending answer generation request...");
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    logger.error(
      { provider, status: response.status, statusText: response.statusText },
      "LLM API error",
    );
    throw new Error(
      `Could not reach ${config.displayName}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage: LLMResponse["usage"];
    model: string;
  };
  const firstChoice = data.choices[0];
  if (!firstChoice) {
    throw new Error(`LLM API returned empty choices (model: ${data.model})`);
  }
  return {
    content: firstChoice.message.content,
    usage: data.usage,
    model: data.model,
  };
}

function parseTokenCount(tokenCount: bigint | number | string): bigint {
  if (typeof tokenCount === "bigint") {
    return tokenCount;
  }
  if (typeof tokenCount === "number") {
    if (!Number.isFinite(tokenCount) || tokenCount < 0) {
      throw new TypeError("tokenCount must be a non-negative finite number when given as number");
    }
    return BigInt(Math.floor(tokenCount));
  }
  if (typeof tokenCount === "string" && /^\d+$/.test(tokenCount)) {
    return BigInt(tokenCount);
  }
  throw new TypeError("tokenCount must be a bigint, number, or numeric string");
}

/**
 * ETH-denominated cost — legacy `sc_llm.ts` merkle-settlement path only, IONOS-only
 * (untouched by the multi-provider work above). Uses IONOS's blended input===output
 * rate from `LLM_PROVIDERS.ionos`, since this function predates and doesn't need the
 * input/output split `convertTokensToUsdcCost` now tracks.
 */
export function convertTokensToCost(tokenCount: bigint | number | string): bigint {
  const tc = parseTokenCount(tokenCount);
  const { num, den } = LLM_PROVIDERS.ionos!.inputPricePerMillion;

  const CONVERSION_RATE_EUR_PER_ETH = 3000n;
  const MILLION = 1_000_000n;
  const WEI_PER_ETH = 1_000_000_000_000_000_000n;

  const numer = tc * num * WEI_PER_ETH;
  const denom = den * CONVERSION_RATE_EUR_PER_ETH * MILLION;

  return numer / denom;
}

/**
 * USDC-denominated cost (6 decimals) for the given provider, pricing prompt and
 * completion tokens separately — providers typically charge more for completion
 * (output) tokens than prompt (input) tokens, so a single blended rate would
 * systematically mis-price a provider with an asymmetric split (e.g. Mistral:
 * $0.50/M input vs $1.50/M output — a 3x gap. See LLM_PROVIDERS above).
 *
 * USDC has 6 decimals and prices are quoted per 1,000,000 tokens, so the 1e6
 * factors cancel exactly — no separate decimals conversion needed. Treats 1
 * EUR = 1 USD = 1 USDC (documented simplification; only relevant for `ionos`,
 * whose price is EUR-quoted — `mistral`'s price is already USD, so USD≈USDC
 * needs no cross-currency approximation at all).
 */
export function convertTokensToUsdcCost(
  usage: {
    prompt_tokens: bigint | number | string;
    completion_tokens: bigint | number | string;
  },
  provider: string,
): bigint {
  const config = getLLMProviderConfig(provider);
  const p = parseTokenCount(usage.prompt_tokens);
  const c = parseTokenCount(usage.completion_tokens);
  const { num: inNum, den: inDen } = config.inputPricePerMillion;
  const { num: outNum, den: outDen } = config.outputPricePerMillion;
  // Cross-multiply to keep one shared denominator instead of assuming inDen === outDen.
  // No explicit 1e6 factor here — as in the single-rate formula this replaces, the
  // "per 1,000,000 tokens" divisor and USDC's 6 decimals cancel exactly.
  return (p * inNum * outDen + c * outNum * inDen) / (inDen * outDen);
}

export interface Leaf {
  id: number;
  user: `0x${string}`;
  serviceProvider: `0x${string}`;
  tokenCount: bigint;
  cost: bigint;
  timestamp: string;
}

interface MerkleTreeData {
  treeIndex: number;
  root: string | null;
  processed: boolean;
  createdAt: string;
  processedAt: string | null;
  leaves: Leaf[];
}

interface TreesData {
  currentTreeIndex: number;
  trees: MerkleTreeData[];
}

export async function saveLeafToTree(
  userAddress: `0x${string}`,
  serviceProvider: `0x${string}`,
  tokenCount: bigint,
  cost: bigint,
): Promise<number> {
  const timestamp = new Date().toISOString();
  const newLeaf: Leaf = { id: 0, user: userAddress, serviceProvider, tokenCount, cost, timestamp };
  logger.info({ leaf: newLeaf }, "Saving leaf to tree");
  return appendLeafToTrees(newLeaf, MERKLE_TREE_FILE);
}

export async function appendLeafToTrees(dataToAppend: Leaf, fileName: string): Promise<number> {
  let treesData: TreesData | null = null;

  try {
    const bodyContents = await getS3Object(fileName);
    if (bodyContents === null) {
      throw new Error(`File ${fileName} doesn't exist`);
    }
    const parsed = JSON.parse(bodyContents) as TreesData;
    treesData = {
      ...parsed,
      trees: parsed.trees.map((tree) => ({
        ...tree,
        leaves: restoreBigIntsInLeaves(tree.leaves),
      })),
    };
  } catch {
    logger.info({ file: fileName }, "File doesn't exist, creating new trees structure");
  }

  if (treesData === null) {
    treesData = {
      currentTreeIndex: 0,
      trees: [
        {
          treeIndex: 0,
          root: null,
          processed: false,
          createdAt: new Date().toISOString(),
          processedAt: null,
          leaves: [],
        },
      ],
    };
  }

  const currentTree = treesData.trees[treesData.currentTreeIndex]!;
  const leafWithId: Leaf = { ...dataToAppend, id: currentTree.leaves.length };
  currentTree.leaves.push(leafWithId);

  // public-read intentional: leaf data is public by design. Settled batches are
  // published on-chain as LLMv1.processBatch calldata, and the usage ledger is
  // treated as public (transparent). Only the merkle root is a commitment; the
  // leaves are not secrets. See README "S3 Storage Layout & Data Classification".
  await putS3Object(fileName, JSON.stringify(treesData, bigintReplacer, 2), {
    contentType: "application/json",
    acl: "public-read",
  });
  logger.info({ treeIndex: treesData.currentTreeIndex }, "Successfully appended leaf to tree");
  return currentTree.leaves.length;
}

export async function startNewTree(fileName: string): Promise<number> {
  const bodyContents = await getS3Object(fileName);
  if (bodyContents === null) {
    throw new Error(`File ${fileName} doesn't exist`);
  }
  const treesData = JSON.parse(bodyContents) as TreesData;

  const newTreeIndex = treesData.trees.length;
  treesData.trees.push({
    treeIndex: newTreeIndex,
    root: null,
    processed: false,
    createdAt: new Date().toISOString(),
    processedAt: null,
    leaves: [],
  });
  treesData.currentTreeIndex = newTreeIndex;

  // public-read intentional — see appendLeafToTrees / README data classification.
  await putS3Object(fileName, JSON.stringify(treesData, bigintReplacer, 2), {
    contentType: "application/json",
    acl: "public-read",
  });
  logger.info({ newTreeIndex }, "Started new tree");
  return newTreeIndex;
}

export async function checkWalletBalance(
  address: `0x${string}`,
  requiredBalance: bigint,
): Promise<void> {
  const activeChain = getChain();
  // Falls back to the chain's public endpoint when unset — fine for testnets, but
  // set RPC_URL_<NETWORK> for anything carrying real traffic (see getRpcUrl).
  const rpcUrl = getRpcUrl(toCAIP2(activeChain.id));
  const publicClient = createPublicClient({ chain: activeChain, transport: http(rpcUrl) });

  const { address: contractAddress, abi: llmAbi } = getLLMv1ContractConfig();
  const contract = getContract({
    address: contractAddress,
    abi: llmAbi,
    client: { public: publicClient },
  });

  const currentBalance = (await contract.read.checkBalance([address])) as bigint;
  logger.info({ address, balance: String(currentBalance) }, "Checking balance");
  if (currentBalance < requiredBalance) {
    throw new Error(
      `Insufficient balance. Required: ${requiredBalance}, Current: ${currentBalance}`,
    );
  }
}

export async function processMerkleTree(
  fileName: string,
  treeIndex: number | null = null,
): Promise<void> {
  if (!fileName) {
    throw new Error("Missing file name");
  }

  let treesData: TreesData;
  try {
    const bodyContents = await getS3Object(fileName);
    if (bodyContents === null) {
      throw new Error(`File ${fileName} doesn't exist`);
    }
    const parsed = JSON.parse(bodyContents) as TreesData;
    treesData = {
      ...parsed,
      trees: parsed.trees.map((tree) => ({
        ...tree,
        leaves: restoreBigIntsInLeaves(tree.leaves),
      })),
    };
  } catch {
    throw new Error(`File ${fileName} doesn't exist`);
  }

  const targetTreeIndex = treeIndex !== null ? treeIndex : treesData.currentTreeIndex;
  const targetTree = treesData.trees[targetTreeIndex];

  if (!targetTree) {
    throw new Error(`Tree with index ${targetTreeIndex} doesn't exist`);
  }
  if (targetTree.processed) {
    throw new Error(`Tree ${targetTreeIndex} has already been processed`);
  }

  const llmLeafStructs = targetTree.leaves;
  const llmLeafsArray = llmLeafStructs.map((leaf) => [
    leaf.id,
    leaf.user,
    leaf.serviceProvider,
    leaf.tokenCount,
    leaf.cost,
    leaf.timestamp,
  ]);

  const tree = StandardMerkleTree.of(llmLeafsArray, [
    "int256",
    "address",
    "address",
    "uint256",
    "uint256",
    "string",
  ]);
  const root = tree.root;
  logger.info({ treeIndex: targetTreeIndex, root }, "Prepared the merkle tree");

  const proofs = llmLeafsArray.map((_, i) => tree.getProof(i));

  const account = privateKeyToAccount(loadPrivateKey("NFT_WALLET_PRIVATE_KEY"));
  const activeChain = getChain();
  // Falls back to the chain's public endpoint when unset — fine for testnets, but
  // set RPC_URL_<NETWORK> for anything carrying real traffic (see getRpcUrl).
  const rpcUrl = getRpcUrl(toCAIP2(activeChain.id));
  const publicClient = createPublicClient({ chain: activeChain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({
    account,
    chain: activeChain,
    transport: http(rpcUrl),
  });

  const { address: contractAddress, abi: llmAbi } = getLLMv1ContractConfig();
  const llmContract = getContract({
    address: contractAddress,
    abi: llmAbi,
    client: { public: publicClient, wallet: walletClient },
  });

  const leavesForContract = llmLeafStructs.map((l) => ({ ...l, id: BigInt(l.id) }));
  const txHash = await llmContract.write.processBatch([
    root as `0x${string}`,
    leavesForContract,
    proofs as `0x${string}`[][],
  ]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") {
    throw new Error(`processBatch transaction reverted (hash: ${txHash})`);
  }
  logger.info({ treeIndex: targetTreeIndex, root }, "Processed Merkle tree");

  targetTree.processed = true;
  targetTree.root = root;
  targetTree.processedAt = new Date().toISOString();

  try {
    // public-read intentional — see appendLeafToTrees / README data classification.
    await putS3Object(fileName, JSON.stringify(treesData, bigintReplacer, 2), {
      contentType: "application/json",
      acl: "public-read",
    });
  } catch (err) {
    logger.error(
      { err, treeIndex: targetTreeIndex, root, txHash },
      "processBatch succeeded on-chain but persisting the processed tree to S3 failed — manual reconciliation needed",
    );
    throw err;
  }
  logger.info({ treeIndex: targetTreeIndex }, "Tree marked as processed");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bigintReplacer(_key: string, value: any): any {
  return typeof value === "bigint" ? value.toString() : value;
}

function restoreBigIntsInLeaves(arr: unknown[]): Leaf[] {
  if (!Array.isArray(arr)) {
    return arr as Leaf[];
  }
  return arr.map((leaf) => {
    if (leaf && typeof leaf === "object") {
      const l = leaf as Record<string, unknown>;
      if (l["tokenCount"] !== undefined && l["tokenCount"] !== null) {
        l["tokenCount"] = BigInt(l["tokenCount"] as string);
      }
      if (l["cost"] !== undefined && l["cost"] !== null) {
        l["cost"] = BigInt(l["cost"] as string);
      }
    }
    return leaf as Leaf;
  });
}
