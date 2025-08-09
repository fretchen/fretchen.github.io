// @ts-check

import { verifyMessage, getContract, createPublicClient, http } from "viem";

import { getChain, getLLMv1ContractConfig } from "./getChain.js";

const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";
const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";

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
