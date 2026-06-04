import {
  convertTokensToCost,
  callLLMAPI,
  checkWalletBalance,
  saveLeafToTree,
  verify_wallet,
  processMerkleTree,
  startNewTree,
  type LLMMessage,
} from "./llm_service.js";

import { parseEther } from "viem";
import pino from "pino";
import type { ScwEvent } from "./types.js";

export type { ScwEvent };

interface ScwResponse {
  body: string | unknown;
  statusCode: number;
  headers: Record<string, string>;
}

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const MERKLE_TREE_THRESHOLD = 4;
const REQUIRED_BALANCE = "0.00001";
const MERKLE_TREE_FILE = "merkle/trees.json";

function isHexAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function handle(event: ScwEvent, _context: unknown): Promise<ScwResponse> {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let prompt: LLMMessage[];
  let body: Record<string, unknown>;
  if (event.httpMethod === "POST") {
    body =
      typeof event.body === "string"
        ? JSON.parse(event.body)
        : (event.body as Record<string, unknown>);
    logger.debug({ body }, "Parsed body");
  } else {
    return {
      body: JSON.stringify({ error: "Only POST requests are supported" }),
      headers,
      statusCode: 400,
    };
  }

  const data = body["data"] as Record<string, unknown> | undefined;
  if (Array.isArray(data?.["prompt"])) {
    prompt = data["prompt"] as LLMMessage[];
  } else {
    return { body: JSON.stringify({ error: "No prompt provided" }), headers, statusCode: 400 };
  }
  logger.debug({ prompt }, "Prompt received");

  let useDummyData = false;
  if (data?.["useDummyData"] !== undefined) {
    if (typeof data["useDummyData"] !== "boolean") {
      return {
        body: JSON.stringify({ error: "Invalid useDummyData flag" }),
        headers,
        statusCode: 400,
      };
    }
    useDummyData = data["useDummyData"];
  }

  const auth = body["auth"] as Record<string, unknown> | undefined;
  if (!auth) {
    return { body: JSON.stringify({ error: "No auth data provided" }), headers, statusCode: 400 };
  }
  if (!auth["address"] || !auth["signature"] || !auth["message"]) {
    return { body: JSON.stringify({ error: "Incomplete auth data" }), headers, statusCode: 400 };
  }
  const address = auth["address"] as `0x${string}`;
  const signature = auth["signature"] as `0x${string}`;
  const message = auth["message"] as string;

  try {
    await verify_wallet(address, signature, message);
  } catch (error) {
    logger.error({ err: error }, "Wallet verification failed");
    return {
      body: JSON.stringify({ error: (error as Error).message }),
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
      body: JSON.stringify({ error: (error as Error).message }),
      headers,
      statusCode: 402,
    };
  }

  let llmData: Awaited<ReturnType<typeof callLLMAPI>>;
  try {
    logger.info({ prompt }, "Generating answer for prompt");
    llmData = await callLLMAPI(prompt, useDummyData);
  } catch (error) {
    logger.error({ err: error }, "Error during answer generation");
    const msg = (error as Error).message;
    const statusCode = msg.includes("API Token nicht gefunden") ? 401 : 500;
    return { body: JSON.stringify({ error: msg }), statusCode, headers };
  }

  const totalTokensRaw = llmData?.usage?.total_tokens;
  if (
    totalTokensRaw === null ||
    totalTokensRaw === undefined ||
    (typeof totalTokensRaw !== "number" &&
      typeof totalTokensRaw !== "bigint" &&
      !/^\d+$/.test(String(totalTokensRaw)))
  ) {
    logger.error({ data: llmData }, "Invalid total_tokens in LLM response");
    return {
      body: JSON.stringify({ error: "Invalid token count from LLM" }),
      headers,
      statusCode: 500,
    };
  }

  const tokenCountBigInt =
    typeof totalTokensRaw === "bigint"
      ? totalTokensRaw
      : BigInt(Math.floor(Number(totalTokensRaw)));

  const cost = convertTokensToCost(tokenCountBigInt);

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
    tokenCountBigInt,
    cost,
  );

  if (newMerkleLength >= MERKLE_TREE_THRESHOLD) {
    logger.info("Time to process the batch");
    await processMerkleTree(MERKLE_TREE_FILE);
    logger.info("Starting new tree after processing");
    await startNewTree(MERKLE_TREE_FILE);
  } else {
    logger.info({ length: newMerkleLength }, "Merkle tree not ready for processing");
  }

  logger.info({ data: llmData }, "Answer generated and saved to Merkle Tree");
  return { body: llmData, statusCode: 200, headers };
}

if (process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();
    const scw_fnc_node = await import("@scaleway/serverless-functions");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scw_fnc_node.serveHandler(handle as any, 8080);
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
