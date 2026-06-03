import pino from "pino";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { parseBearerToken, verifySignedMessage } from "./auth_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const MERKLE_TREE_FILE = "merkle/trees.json";

interface ScwEvent {
  httpMethod: string;
  queryStringParameters?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
}

interface ScwResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function isHexAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function streamToString(stream: AsyncIterable<Uint8Array> | string): Promise<string> {
  if (typeof stream === "string") return stream;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function verifyLeafHistoryAuth(
  queryAddress: string,
  authHeader: string | undefined,
): Promise<string | null> {
  const payload = parseBearerToken(authHeader);
  if (!payload) return "Unauthorized";
  return verifySignedMessage(payload.address, payload.signature, payload.message, "leaf-history", queryAddress);
}

export async function handle(event: ScwEvent, _context: unknown): Promise<ScwResponse> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod === "GET") {
    const address = event.queryStringParameters?.address;

    if (!isHexAddress(address)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid or missing address query parameter" }),
      };
    }

    // Scaleway normalizes headers to lowercase in production — check both casings
    const authHeader = event.headers?.["Authorization"] ?? event.headers?.["authorization"];
    const authError = await verifyLeafHistoryAuth(address, authHeader);
    if (authError) {
      logger.warn({ address, error: authError }, "Unauthorized leaf-history request");
      return { statusCode: 401, headers, body: JSON.stringify({ error: authError }) };
    }

    try {
      const s3Client = new S3Client({
        region: "nl-ams",
        endpoint: "https://s3.nl-ams.scw.cloud",
        credentials: {
          accessKeyId: process.env.SCW_ACCESS_KEY ?? "",
          secretAccessKey: process.env.SCW_SECRET_KEY ?? "",
        },
      });

      const getResult = await s3Client.send(
        new GetObjectCommand({ Bucket: "my-imagestore", Key: MERKLE_TREE_FILE }),
      );
      const bodyStr = await streamToString(getResult.Body as AsyncIterable<Uint8Array>);
      const treesData = JSON.parse(bodyStr) as { trees?: Array<{ treeIndex?: number; leafs?: Array<{ user?: string; id: number; serviceProvider: string; tokenCount: string; cost: string; timestamp: string }>; processed?: boolean; root?: string }> };

      const leafs: unknown[] = [];
      (treesData.trees ?? []).forEach((tree, idx) => {
        const treeIndex = tree.treeIndex ?? idx;
        (tree.leafs ?? []).forEach((leaf) => {
          if (leaf.user?.toLowerCase() === address.toLowerCase()) {
            leafs.push({
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

      (leafs as Array<{ timestamp: string }>).sort((a, b) =>
        a.timestamp > b.timestamp ? -1 : 1,
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ leafs, count: leafs.length, address }),
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

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
}

/* Local dev server — not executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();
    const scw_fnc_node = await import("@scaleway/serverless-functions");
    (scw_fnc_node as { serveHandler: (h: typeof handle, port: number) => void }).serveHandler(handle, 8080);
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
