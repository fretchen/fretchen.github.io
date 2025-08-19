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
  startNewTree,
} from "./llm_service.js";

import { parseEther } from "viem";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const MERKLE_TREE_THRESHOLD = 4;
const REQUIRED_BALANCE = "0.00001";

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
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // get the prompt from the event
  let prompt;
  let body;
  if (event.httpMethod === "POST") {
    // Body parsen (JSON-String zu Objekt)
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    logger.debug({ body }, "Parsed body");
  } else {
    return {
      body: JSON.stringify({ error: "Only POST requests are supported" }),
      headers,
      statusCode: 400,
    };
  }

  // check if the prompt is in the body
  if (body.data && body.data.prompt) {
    prompt = body.data.prompt;
  } else {
    return {
      body: JSON.stringify({ error: "No prompt provided" }),
      headers,
      statusCode: 400,
    };
  }
  logger.debug({ prompt }, "Prompt received");
  // check if we would like to work with dummy data. If no value is provided, we set it to false
  let useDummyData = false;
  if (body.data && body.data.useDummyData !== undefined) {
    // check that the useDummyData flag is a boolean
    if (typeof body.data.useDummyData !== "boolean") {
      return {
        body: JSON.stringify({ error: "Invalid useDummyData flag" }),
        headers,
        statusCode: 400,
      };
    }
    useDummyData = body.data.useDummyData;
  }

  // verify that the official wallet actually sent the request
  let auth;
  if (body.auth) {
    auth = body.auth;
  } else {
    return {
      body: JSON.stringify({ error: "No auth data provided" }),
      headers,
      statusCode: 400,
    };
  }
  // now also make sure that the necessary information is provided
  if (!auth.address || !auth.signature || !auth.message) {
    return {
      body: JSON.stringify({ error: "Incomplete auth data" }),
      headers,
      statusCode: 400,
    };
  }
  const { address, signature, message } = auth;

  try {
    // Extract necessary information for wallet verification
    await verify_wallet(address, signature, message);
  } catch (error) {
    logger.error({ err: error }, "Wallet verification failed");
    return {
      body: JSON.stringify({ error: error.message }),
      headers,
      statusCode: 401,
    };
  }

  const requiredBalanceInWei = parseEther(REQUIRED_BALANCE);
  try {
    await checkWalletBalance(address, requiredBalanceInWei);
  } catch (error) {
    logger.error({ err: error }, "Wallet balance check failed");
    return {
      body: JSON.stringify({ error: error.message }),
      headers,
      statusCode: 402, // Payment Required
    };
  }
  let data;
  try {
    logger.info({ prompt }, "Generating answer for prompt");

    // Pass prompt to the function
    data = await callLLMAPI(prompt, useDummyData);
  } catch (error) {
    logger.error({ err: error }, "Error during answer generation");
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
    BigInt(data.usage.total_tokens), // Convert to bigint
    cost,
  );
  // time to see if the merkle tree is so big that we should process it and settle
  // the transactions on the blockchain.
  if (newMerkleLength >= MERKLE_TREE_THRESHOLD) {
    logger.info("Time to process the batch");
    await processMerkleTree("merkle/trees.json");

    // After processing, start a new tree for future leaves
    logger.info("Starting new tree after processing");
    await startNewTree("merkle/trees.json");
  } else {
    logger.info({ length: newMerkleLength }, "Merkle tree not ready for processing");
  }
  logger.info({ data }, "Answer generated and saved to Merkle Tree");
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
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
