// @ts-check

import { verifyMessage, getContract, createPublicClient, createWalletClient, http } from "viem";
import { getChain, getLLMv1ContractConfig } from "./getChain.js";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { privateKeyToAccount } from "viem/accounts";

const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";
const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";
export const JSON_BASE_PATH = "https://my-imagestore.s3.nl-ams.scw.cloud/";
const BUCKET_NAME = "my-imagestore";

/**
 * Generates an answer based on the prompt.
 * @param {string} prompt - The prompt for image generation.
 * @param {boolean} dummy - If true, returns a dummy response.
 * @returns {Promise<{
 *   content: string,
 *   usage: {
 *     prompt_tokens: number,
 *     completion_tokens: number,
 *     total_tokens: number
 *   },
 *   model: string
 * }>} - The generated prompt response.
 */

export async function callLLMAPI(prompt, dummy = false) {
  if (dummy) {
    return {
      content: "I am a placeholder for the LLM response",
      usage: {
        prompt_tokens: 5,
        completion_tokens: 15,
        total_tokens: 15,
      },
      model: "placeholder model",
    };
  }
  const ionosApiToken = process.env.IONOS_API_TOKEN;

  if (!ionosApiToken) {
    throw new Error(
      "API token not found. Please configure the IONOS_API_TOKEN environment variable.",
    );
  }

  if (!prompt) {
    throw new Error("No prompt provided.");
  }
  console.log("Generating answer for prompt:", prompt);
  const promptArray = JSON.parse(prompt);

  const headers = {
    Authorization: `Bearer ${ionosApiToken}`,
    "Content-Type": "application/json",
  };

  const body = {
    model: MODEL_NAME,
    messages: promptArray,
  };

  console.log("Sending answer generation request...");
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    timeout: 60000,
  });

  if (!response.ok) {
    console.error(`IONOS API Error: ${response.status} ${response.statusText}`);
    throw new Error(`Could not reach IONOS: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model,
  };
}

/**
 * Converts the used tokens directly to a cost in wei (Solidity standard).
 * Accepts bigint, number or numeric string for tokenCount. Numbers are floored
 * and converted to bigint. For very large numbers prefer passing a bigint or string.
 * @param {bigint|number|string} tokenCount - The number of tokens used.
 * @returns {bigint} - The cost in wei.
 */
export function convertTokensToCost(tokenCount) {
  // normalize tokenCount to bigint
  let tc;
  if (typeof tokenCount === "bigint") {
    tc = tokenCount;
  } else if (typeof tokenCount === "number") {
    if (!Number.isFinite(tokenCount) || tokenCount < 0) {
      throw new TypeError("tokenCount must be a non-negative finite number when given as number");
    }
    // floor fractional counts and convert to bigint
    // Note: numbers > Number.MAX_SAFE_INTEGER may have lost precision; prefer bigint/string
    tc = BigInt(Math.floor(tokenCount));
  } else if (typeof tokenCount === "string" && /^\d+$/.test(tokenCount)) {
    tc = BigInt(tokenCount);
  } else {
    throw new TypeError("tokenCount must be a bigint, number, or numeric string");
  }

  // pricePerMillionTokensInEUR = 0.71 EUR = 71 / 100
  const PRICE_PER_MILLION_TOKENS_IN_EUR_NUM = 71n;
  const PRICE_PER_MILLION_TOKENS_IN_EUR_DEN = 100n;

  // conversion rate: EUR per ETH (example fixed value, replace from env if needed)
  const CONVERSION_RATE_EUR_PER_ETH = 3000n;

  const MILLION = 1_000_000n;
  const WEI_PER_ETH = 1_000_000_000_000_000_000n; // 1e18

  // wei = tokenCount * (PRICE_NUM / PRICE_DEN) / CONVERSION_RATE / 1_000_000 * WEI_PER_ETH
  // rearranged to integer arithmetic: (tokenCount * PRICE_NUM * WEI) / (PRICE_DEN * CONVERSION * 1_000_000)
  const numer = tc * PRICE_PER_MILLION_TOKENS_IN_EUR_NUM * WEI_PER_ETH;
  const denom = PRICE_PER_MILLION_TOKENS_IN_EUR_DEN * CONVERSION_RATE_EUR_PER_ETH * MILLION;

  return numer / denom; // integer division (truncates)
}

/**
 * Verifies that an ethereum wallet really signed the request.
 * The parameters must match the expected input for viem's verifyMessage function:
 *   - address: The Ethereum address that should have signed the message.
 *   - signature: The hex-encoded signature string (with 0x prefix).
 *   - message: The original message string that was signed.
 * @param {`0x${string}`} address - The Ethereum address of the signer (must start with 0x).
 * @param {`0x${string}`} signature - The hex-encoded signature (must include 0x prefix).
 * @param {string} message - The original message that was signed.
 * @returns {Promise<void>} Throws an error if the signature is invalid.
 */
export async function verify_wallet(address, signature, message) {
  try {
    const isValid = await verifyMessage({
      address,
      message,
      signature,
    });

    if (!isValid) {
      throw new Error("Invalid wallet signature.");
    } else {
      console.log("Wallet signature verified successfully.");
    }
  } catch (error) {
    console.error("Signature verification failed:", error);
    throw new Error("Invalid wallet signature.");
  }
}

/**
 * Appends a leaf to a file that can be later processed as a Merkle Tree
 * @param {`0x${string}`} userAddress -
 * @param {`0x${string}`} serviceProvider -
 * @param {bigint} tokenCount -
 * @param {bigint} cost -
 * @returns {Promise<number>} - Length of the updated file
 */

export async function saveLeafToTree(userAddress, serviceProvider, tokenCount, cost) {
  // Implementation for saving the message and its metadata to the tree structure

  // each leaf has the structure
  // id: an int generated within the merkletree
  // user: the public address of the user that ordered the request
  // serviceProvider: the public address of the service provider
  // tokenCount: the number of tokens used for the request
  // cost: the cost of the request in ether
  // timestamp: the timestamp of the request

  // generate the timestamp as a string when, the function is called
  const timestamp = new Date().toISOString();

  // the id shall be simply an increment for each new leaf
  const newLeaf = {
    id: 1,
    user: userAddress,
    serviceProvider,
    tokenCount,
    cost,
    timestamp,
  };
  console.log("Saving leaf to tree:", newLeaf);
  return appendToS3Json(newLeaf, "merkle/leaves.json");
}

/**
 * @typedef {Object} Leaf
 * @property {number} id
 * @property {`0x${string}`} user
 * @property {`0x${string}`} serviceProvider
 * @property {bigint} tokenCount
 * @property {bigint} cost
 * @property {string} timestamp
 */

/**
 * Appends a dictionary to an existing JSON file in S3, or creates a new file if it doesn't exist.
 * @param {Leaf} dataToAppend - The dictionary/object to append to the JSON
 * @param {string} fileName - The filename of the JSON file in S3
 * @returns {Promise<number>} - Length of the updated file
 */
export async function appendToS3Json(dataToAppend, fileName) {
  const accessKey = process.env.SCW_ACCESS_KEY;
  const secretKey = process.env.SCW_SECRET_KEY;

  const s3Client = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  let existingData = null;
  let updatedData;

  // Try to get existing file
  const getParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  };

  try {
    const getResult = await s3Client.send(new GetObjectCommand(getParams));
    const bodyContents = await streamToString(getResult.Body);
    // parse and restore BigInts for known fields
    existingData = JSON.parse(bodyContents);
    existingData = restoreBigIntsInLeaves(existingData);
  } catch {
    // File doesn't exist, we'll create a new one
    console.log(`File ${fileName} doesn't exist, creating new file`);
    existingData = null;
  }

  // Determine how to append based on mode and existing data
  // We also need to calculate the size of the batch to see if
  // we should launch a new Merkle tree later
  let batchSize = 0;
  if (existingData === null) {
    // Create new array with the data
    updatedData = [dataToAppend];
    batchSize = 1;
  } else if (Array.isArray(existingData)) {
    // calculate the length of the existingData
    const existingLength = existingData.length;
    // set the id of the element to existing length
    dataToAppend.id = existingLength;
    // Append to existing array
    updatedData = [...existingData, dataToAppend];
    batchSize = existingLength + 1;
  } else {
    // This should not happen, so raise an error.
    throw new Error("Unexpected data format");
  }

  console.log(`Updated data for ${fileName}:`, updatedData);
  // Upload the updated data
  const putParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    // use bigintReplacer so BigInts are written as numeric strings
    Body: JSON.stringify(updatedData, bigintReplacer, 2),
    ContentType: "application/json",
    ACL: "public-read",
  };

  await s3Client.send(new PutObjectCommand(putParams));
  console.log(`Successfully appended to ${fileName}`);
  return batchSize; // Return the size of the updated file
}

/**
 * Helper function to convert a readable stream to string
 * @param {ReadableStream} stream - The stream to convert
 * @returns {Promise<string>} - The stream contents as string
 */
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Checks that the address that called the LLM service has enough balance to pay for the service.
 * @param {`0x${string}`} address - The Ethereum address of the caller.
 * @param {number} requiredBalance - The minimum balance required to call the service.
 * @returns {Promise<void>} Resolves if the balance is sufficient, rejects otherwise.
 */
export async function checkWalletBalance(address, requiredBalance) {
  // set up the wallets
  const activeChain = getChain();
  const publicClient = createPublicClient({
    chain: activeChain,
    transport: http(),
  });

  const { address: contractAddress, abi: llmAbi } = getLLMv1ContractConfig();
  const contract = getContract({
    address: contractAddress,
    abi: llmAbi,
    client: {
      public: publicClient,
    },
  });

  const currentBalance = /** @type {bigint} */ (await contract.read.checkBalance([address]));
  console.log(`Checking balance for ${address}: ${currentBalance}`);
  if (currentBalance < requiredBalance) {
    throw new Error(
      `Insufficient balance. Required: ${requiredBalance}, Current: ${currentBalance}`,
    );
  }
}

/**
 * Checks that the address that called the LLM service has enough balance to pay for the service.
 * @param {string} fileName - The filename of the JSON file in S3
 * @param {number} requiredBalance - The minimum balance required to call the service.
 * @returns {Promise<void>} Resolves if the balance is sufficient, rejects otherwise.
 */
export async function processMerkleTree(fileName) {
  // Implementation for processing the Merkle tree
  const accessKey = process.env.SCW_ACCESS_KEY;
  const secretKey = process.env.SCW_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("Missing S3 credentials");
  }

  if (!fileName) {
    throw new Error("Missing file name");
  }

  const s3Client = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  let llmLeafStructs = null;

  // Try to get existing file
  const getParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  };

  try {
    const getResult = await s3Client.send(new GetObjectCommand(getParams));
    const bodyContents = await streamToString(getResult.Body);
    llmLeafStructs = JSON.parse(bodyContents);
    // restore BigInt fields (tokenCount, cost) which were serialized as strings
    llmLeafStructs = restoreBigIntsInLeaves(llmLeafStructs);
  } catch {
    // File doesn't exist, we'll create a new one
    console.log(`File ${fileName} doesn't exist, creating new file`);
    throw new Error(`File ${fileName} doesn't exist`);
  }

  // 2. Create the array of arrays for the Merkle tree
  const llmLeafsArray = llmLeafStructs.map((leaf) => [
    leaf.id,
    leaf.user,
    leaf.serviceProvider,
    leaf.tokenCount,
    leaf.cost,
    leaf.timestamp,
  ]);

  // 3. Create a Merkle tree from the LLMLeafs with the openzeppelin library
  const tree = StandardMerkleTree.of(llmLeafsArray, [
    "int256",
    "address",
    "address",
    "uint256",
    "uint256",
    "string",
  ]);
  const root = tree.root;
  console.log(`Prepared the merkle tree with root ${root}`);

  // prepare the proofs
  const proofs = llmLeafsArray.map((_, i) => tree.getProof(i));
  // prep for writing everything
  // Wallet-Client mit dem Account erstellen
  // Private Key aus der Umgebungsvariable laden
  const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("NFT_WALLET_PRIVATE_KEY nicht konfiguriert");
  }

  // Account aus dem privaten Schlüssel erstellen
  const account = privateKeyToAccount(`0x${privateKey}`);

  const activeChain = getChain();
  const publicClient = createPublicClient({
    chain: activeChain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: activeChain,
    transport: http(),
  });

  const { address: contractAddress, abi: llmAbi } = getLLMv1ContractConfig();
  const llmContract = getContract({
    address: contractAddress,
    abi: llmAbi,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
  });
  await llmContract.write.processBatch([root, llmLeafStructs, proofs]);
  console.log(`Processed Merkle tree with root ${root} and proofs`, proofs);
}

/**
 * JSON replacer converting BigInt to string (for JSON.stringify).
 * @param {string} _key
 * @param {any} value
 */
function bigintReplacer(_key, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

/**
 * Helper to restore known BigInt fields after JSON.parse
 * @param {any[]} arr
 * @returns {any[]}
 */
function restoreBigIntsInLeaves(arr) {
  if (!Array.isArray(arr)) {
    return arr;
  }
  return arr.map((leaf) => {
    if (leaf && typeof leaf === "object") {
      if (leaf.tokenCount !== undefined && leaf.tokenCount !== null) {
        leaf.tokenCount = BigInt(leaf.tokenCount);
      }
      if (leaf.cost !== undefined && leaf.cost !== null) {
        leaf.cost = BigInt(leaf.cost);
      }
    }
    return leaf;
  });
}
