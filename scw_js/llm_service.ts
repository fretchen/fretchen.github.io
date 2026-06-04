import { verifyMessage, getContract, createPublicClient, createWalletClient, http } from "viem";
import { getChain, getLLMv1ContractConfig } from "./getChain.js";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { privateKeyToAccount } from "viem/accounts";
import pino from "pino";

const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";
const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";
export const JSON_BASE_PATH = "https://my-imagestore.s3.nl-ams.scw.cloud/";
const BUCKET_NAME = "my-imagestore";
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

function getS3Credentials(): { accessKey: string; secretKey: string } {
  const accessKey = process.env.SCW_ACCESS_KEY;
  const secretKey = process.env.SCW_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error("Missing S3 credentials: SCW_ACCESS_KEY and SCW_SECRET_KEY must be set");
  }
  return { accessKey, secretKey };
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

export async function verify_wallet(
  address: `0x${string}`,
  signature: `0x${string}`,
  message: string,
): Promise<void> {
  try {
    const isValid = await verifyMessage({ address, message, signature });
    if (!isValid) {
      logger.warn({ address }, "Invalid wallet signature.");
      throw new Error("Invalid wallet signature.");
    } else {
      logger.info({ address }, "Wallet signature verified successfully.");
    }
  } catch (error) {
    logger.error({ err: error }, "Signature verification failed");
    throw new Error("Invalid wallet signature.", { cause: error });
  }
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
  const { accessKey, secretKey } = getS3Credentials();
  const s3Client = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  let treesData: TreesData | null = null;

  try {
    const getResult = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileName }),
    );
    const bodyContents = await streamToString(
      getResult.Body as unknown as AsyncIterable<Uint8Array>,
    );
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

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: JSON.stringify(treesData, bigintReplacer, 2),
      ContentType: "application/json",
      ACL: "public-read",
    }),
  );
  logger.info({ treeIndex: treesData.currentTreeIndex }, "Successfully appended leaf to tree");
  return currentTree.leaves.length;
}

export async function startNewTree(fileName: string): Promise<number> {
  const { accessKey, secretKey } = getS3Credentials();
  const s3Client = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  const getResult = await s3Client.send(
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileName }),
  );
  const bodyContents = await streamToString(getResult.Body as unknown as AsyncIterable<Uint8Array>);
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

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: JSON.stringify(treesData, bigintReplacer, 2),
      ContentType: "application/json",
      ACL: "public-read",
    }),
  );
  logger.info({ newTreeIndex }, "Started new tree");
  return newTreeIndex;
}

export async function appendToS3Json(dataToAppend: Leaf, fileName: string): Promise<number> {
  const { accessKey, secretKey } = getS3Credentials();
  const s3Client = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  let existingData: Leaf[] | null = null;

  try {
    const getResult = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileName }),
    );
    const bodyContents = await streamToString(
      getResult.Body as unknown as AsyncIterable<Uint8Array>,
    );
    existingData = restoreBigIntsInLeaves(JSON.parse(bodyContents) as Leaf[]);
  } catch {
    logger.info({ file: fileName }, "File doesn't exist, creating new file");
  }

  let updatedData: Leaf[];
  let batchSize: number;

  if (existingData === null) {
    updatedData = [dataToAppend];
    batchSize = 1;
  } else if (Array.isArray(existingData)) {
    const existingLength = existingData.length;
    const dataToAppendWithId: Leaf = { ...dataToAppend, id: existingLength };
    updatedData = [...existingData, dataToAppendWithId];
    batchSize = existingLength + 1;
  } else {
    throw new Error("Unexpected data format");
  }

  logger.debug({ updatedData }, `Updated data for ${fileName}`);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: JSON.stringify(updatedData, bigintReplacer, 2),
      ContentType: "application/json",
      ACL: "public-read",
    }),
  );
  logger.info({ file: fileName }, "Successfully appended to file");
  return batchSize;
}

async function streamToString(stream: AsyncIterable<Uint8Array>): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
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

  const { accessKey, secretKey } = getS3Credentials();
  const s3Client = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  let treesData: TreesData;
  try {
    const getResult = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileName }),
    );
    const bodyContents = await streamToString(
      getResult.Body as unknown as AsyncIterable<Uint8Array>,
    );
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

  const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("NFT_WALLET_PRIVATE_KEY nicht konfiguriert");
  }

  const account = privateKeyToAccount(`0x${privateKey}`);
  const activeChain = getChain();
  const publicClient = createPublicClient({ chain: activeChain, transport: http() });
  const walletClient = createWalletClient({ account, chain: activeChain, transport: http() });

  const { address: contractAddress, abi: llmAbi } = getLLMv1ContractConfig();
  const llmContract = getContract({
    address: contractAddress,
    abi: llmAbi,
    client: { public: publicClient, wallet: walletClient },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (llmContract.write as any).processBatch([root, llmLeafStructs, proofs]);
  logger.info({ treeIndex: targetTreeIndex, root }, "Processed Merkle tree");

  targetTree.processed = true;
  targetTree.root = root;
  targetTree.processedAt = new Date().toISOString();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: JSON.stringify(treesData, bigintReplacer, 2),
      ContentType: "application/json",
      ACL: "public-read",
    }),
  );
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
