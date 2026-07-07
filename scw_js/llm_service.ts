import { getContract, createPublicClient, createWalletClient, http } from "viem";
import { getChain, getLLMv1ContractConfig } from "./getChain.js";
import { loadPrivateKey } from "@fretchen/chain-utils";
import { getS3Object, putS3Object } from "@fretchen/s3-utils";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { privateKeyToAccount } from "viem/accounts";
import pino from "pino";

const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";
const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";
const MERKLE_TREE_FILE = "merkle/trees.json";
const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

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

export async function callLLMAPI(prompt: LLMMessage[], dummy = false): Promise<LLMResponse> {
  if (dummy) {
    return {
      content: "I am a placeholder for the LLM response",
      usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 15 },
      model: "placeholder model",
    };
  }
  const ionosApiToken = process.env.IONOS_API_TOKEN;
  logger.info("Work with real API");
  if (!ionosApiToken) {
    throw new Error(
      "API token not found. Please configure the IONOS_API_TOKEN environment variable.",
    );
  }

  if (!prompt || !prompt.length) {
    throw new Error("No prompt provided.");
  }
  logger.info({ prompt }, "Generating answer for prompt");

  const body = { model: MODEL_NAME, messages: prompt };

  logger.debug("Sending answer generation request...");
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${ionosApiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    logger.error({ status: response.status, statusText: response.statusText }, "IONOS API Error");
    throw new Error(`Could not reach IONOS: ${response.status} ${response.statusText}`);
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

export function convertTokensToCost(tokenCount: bigint | number | string): bigint {
  let tc: bigint;
  if (typeof tokenCount === "bigint") {
    tc = tokenCount;
  } else if (typeof tokenCount === "number") {
    if (!Number.isFinite(tokenCount) || tokenCount < 0) {
      throw new TypeError("tokenCount must be a non-negative finite number when given as number");
    }
    tc = BigInt(Math.floor(tokenCount));
  } else if (typeof tokenCount === "string" && /^\d+$/.test(tokenCount)) {
    tc = BigInt(tokenCount);
  } else {
    throw new TypeError("tokenCount must be a bigint, number, or numeric string");
  }

  const PRICE_PER_MILLION_TOKENS_IN_EUR_NUM = 71n;
  const PRICE_PER_MILLION_TOKENS_IN_EUR_DEN = 100n;
  const CONVERSION_RATE_EUR_PER_ETH = 3000n;
  const MILLION = 1_000_000n;
  const WEI_PER_ETH = 1_000_000_000_000_000_000n;

  const numer = tc * PRICE_PER_MILLION_TOKENS_IN_EUR_NUM * WEI_PER_ETH;
  const denom = PRICE_PER_MILLION_TOKENS_IN_EUR_DEN * CONVERSION_RATE_EUR_PER_ETH * MILLION;

  return numer / denom;
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
  const publicClient = createPublicClient({ chain: activeChain, transport: http() });

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
  const publicClient = createPublicClient({ chain: activeChain, transport: http() });
  const walletClient = createWalletClient({ account, chain: activeChain, transport: http() });

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
