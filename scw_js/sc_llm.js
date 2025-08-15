// @ts-check

/**
 * A module for generating prompt answers and uploading them to S3. All integrated
 * with a smart contract on the blockchain.
 */
import {
  convertTokensToCost,
  callLLMAPI,
  checkWalletBalance,
  saveLeafToTree,
  verify_wallet,
  processMerkleTree,
} from "./llm_service.js";

const MERKLE_TREE_THRESHOLD = 4;

/**
 * Type predicate: returns true if addr is a 0x-prefixed 40-hex-char string.
 * @param {unknown} addr
 * @returns {addr is `0x${string}`}
 */
function isHexAddress(addr) {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/**
 * Handler function for the serverless environment.
 * @param {Object} event - The event object.
 * @param {Object} _context - The invocation context.
 * @returns {Promise<{ body: any, statusCode: number, headers: Record<string, string> }>} - The HTTP response.
 */
export async function handle(event, _context) {
  // get the prompt from the event
  let prompt;
  let body;
  if (event.httpMethod === "POST") {
    // Body parsen (JSON-String zu Objekt)
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    console.log("Parsed body: ", body);
  } else {
    return {
      body: JSON.stringify({ error: "Only POST requests are supported" }),
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
    };
  }

  // check if the prompt is in the body
  if (body && body.data && body.data.prompt) {
    prompt = body.data.prompt;
  } else {
    return {
      body: JSON.stringify({ error: "No prompt provided" }),
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
    };
  }
  console.log("Prompt: ", prompt);

  // verify that the official wallet actually sent the request
  let auth;
  if (body && body.auth) {
    auth = body.auth;
  } else {
    return {
      body: JSON.stringify({ error: "No auth data provided" }),
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
    };
  }
  // now also make sure that the necessary information is provided
  if (!auth.address || !auth.signature || !auth.message) {
    return {
      body: JSON.stringify({ error: "Incomplete auth data" }),
      headers: { "Content-Type": "application/json" },
      statusCode: 400,
    };
  }
  const { address, signature, message } = auth;

  try {
    // Extract necessary information for wallet verification
    await verify_wallet(address, signature, message);
  } catch (error) {
    console.error("Wallet verification failed:", error);
    return {
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" },
      statusCode: 401,
    };
  }

  // check that the submitting wallet has enough balance in the contract
  const requiredBalance = 0.01; // Example value, adjust as needed
  try {
    await checkWalletBalance(address, requiredBalance);
  } catch (error) {
    console.error("Wallet balance check failed:", error);
    return {
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" },
      statusCode: 402, // Payment Required
    };
  }
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Content-Type": "application/json",
  };
  let data;
  try {
    console.log(`Generating answer for prompt: "${prompt}"`);

    // Pass prompt to the function
    data = await callLLMAPI(prompt, true);
  } catch (error) {
    console.error(`Error during answer generation: ${error}`);
    const statusCode = error.message.includes("API Token nicht gefunden") ? 401 : 500;
    return {
      body: JSON.stringify({ error: error.message }),
      statusCode,
      headers,
    };
  }

  // time to save the message and the leaf to the tree
  const cost = convertTokensToCost(data.usage.total_tokens);

  const serviceProviderAddress = process.env.NFT_WALLET_PUBLIC_KEY;

  if (!serviceProviderAddress || !isHexAddress(serviceProviderAddress)) {
    return {
      body: JSON.stringify({
        error:
          "Service provider address not configured or invalid. Set NFT_WALLET_PUBLIC_KEY to a 0x-prefixed 40-hex-char address.",
      }),
      headers: { "Content-Type": "application/json" },
      statusCode: 500,
    };
  }
  const newMerkleLength = await saveLeafToTree(
    address,
    serviceProviderAddress,
    data.usage.total_tokens,
    cost,
  );
  // time to see if the merkle tree is so big that we should process it and settle
  // the transactions on the blockchain.
  if (newMerkleLength >= MERKLE_TREE_THRESHOLD) {
    console.log("Time to process the batch");
    await processMerkleTree("merkle/leaves.json");
  } else {
    console.log(`Merkle tree of length ${newMerkleLength} is not ready for processing`);
  }
  console.log("Answer generated and saved to Merkle Tree:", data);
  return {
    body: data,
    statusCode: 200,
    headers,
  };
}

/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
  // An IIFE (Immediately Invoked Function Expression) with async
  (async () => {
    // Load and configure dotenv
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    // Load serverless functions and start server
    const scw_fnc_node = await import("@scaleway/serverless-functions");
    scw_fnc_node.serveHandler(handle, 8080);
  })().catch((err) => console.error("Error starting local server:", err));
}
