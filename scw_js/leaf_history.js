// @ts-check

/**
 * A module that gets the leafs for the wallet and then allows you later to
 * confirm them
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
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const MERKLE_TREE_THRESHOLD = 4;
const REQUIRED_BALANCE = "0.00001";
const MERKLE_TREE_FILE = "merkle/trees.json";

/**
 * Type predicate: returns true if addr is a 0x-prefixed 40-hex-char string.
 * @param {unknown} addr
 * @returns {addr is `0x${string}`}
 */
function isHexAddress(addr) {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/**
 * Helper function to convert a readable stream to string
 * @param {ReadableStream} stream - The stream to convert
 * @returns {Promise<string>} - The stream contents as string
 */
async function streamToString(stream) {
  if (typeof stream === "string") {
    return stream;
  }
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
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

  // Handle GET requests for leaf history
  if (event.httpMethod === "GET") {
    const address = event.queryStringParameters?.address;

    if (!isHexAddress(address)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid or missing address query parameter" }),
      };
    }

    try {
      const s3Client = new S3Client({
        region: "nl-ams",
        endpoint: "https://s3.nl-ams.scw.cloud",
        credentials: {
          accessKeyId: process.env.SCW_ACCESS_KEY,
          secretAccessKey: process.env.SCW_SECRET_KEY,
        },
      });

      const getParams = {
        Bucket: "my-imagestore",
        Key: MERKLE_TREE_FILE,
      };

      const getResult = await s3Client.send(new GetObjectCommand(getParams));
      const bodyStr = await streamToString(getResult.Body);
      const treesData = JSON.parse(bodyStr);

      // Collect all leaves for the given address across all trees
      const leaves = [];
      (treesData.trees || []).forEach((tree) => {
        const treeIndex = tree.treeIndex ?? treesData.trees.indexOf(tree);
        (tree.leaves || []).forEach((leaf) => {
          if (leaf.user?.toLowerCase?.() === address.toLowerCase()) {
            leaves.push({
              id: leaf.id,
              user: leaf.user,
              serviceProvider: leaf.serviceProvider,
              tokenCount: leaf.tokenCount,
              cost: leaf.cost,
              timestamp: leaf.timestamp,
              treeIndex,
              processed: !!tree.processed,
              root: tree.root ?? null,
            });
          }
        });
      });

      // Sort by timestamp desc (newest first)
      leaves.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          leaves,
          count: leaves.length,
          address,
        }),
      };
    } catch (err) {
      logger.error({ err }, "Failed to load merkle trees from S3");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to load leaf history" }),
      };
    }
  }
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
