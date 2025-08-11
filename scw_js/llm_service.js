// @ts-check

import { verifyMessage, getContract, createPublicClient, http } from "viem";
import { getChain, getLLMv1ContractConfig } from "./getChain.js";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";
const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";
export const JSON_BASE_PATH = "https://my-imagestore.s3.nl-ams.scw.cloud/";
const BUCKET_NAME = "my-imagestore";

/**
 * Generates an answer based on the prompt
 * @param {string} prompt - The prompt for image generation
 * @returns {Promise<{ content: any, usage: any, model: any, }>} - The generated prompt
 */

export async function callLLMAPI(prompt) {
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
    serviceProvider: serviceProvider,
    tokenCount: tokenCount,
    cost: cost,
    timestamp: timestamp,
  };
  appendToS3Json(newLeaf, "merkle/leaves.json");
  console.log("Saving leaf to tree:", newLeaf);
}

/**
 * Appends a dictionary to an existing JSON file in S3, or creates a new file if it doesn't exist.
 * @param {Object} dataToAppend - The dictionary/object to append to the JSON
 * @param {string} fileName - The filename of the JSON file in S3
 * @param {string} [appendMode="array"] - How to append: "array" (push to array) or "merge" (merge objects)
 * @returns {Promise<string>} - Path to the updated file
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
    existingData = JSON.parse(bodyContents);
  } catch {
    // File doesn't exist, we'll create a new one
    console.log(`File ${fileName} doesn't exist, creating new file`);
    existingData = null;
  }

  // Determine how to append based on mode and existing data
  if (existingData === null) {
    // Create new array with the data
    updatedData = [dataToAppend];
  } else if (Array.isArray(existingData)) {
    // calculate the length of the existingData
    const existingLength = existingData.length;
    // set the id of the element to existing length
    dataToAppend.id = existingLength;
    // Append to existing array
    updatedData = [...existingData, dataToAppend];
  } else {
    // Convert existing object to array and append
    updatedData = [existingData, dataToAppend];
  }

  console.log(`Updated data for ${fileName}:`, updatedData);
  // Upload the updated data
  const putParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: JSON.stringify(updatedData, null, 2),
    ContentType: "application/json",
    ACL: "public-read",
  };

  await s3Client.send(new PutObjectCommand(putParams));
  console.log(`Successfully appended to ${fileName}`);
  return `${JSON_BASE_PATH}${fileName}`;
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
