import pino from "pino";
import { parseBearerToken, parseOwnerAddresses, verifySignedMessage } from "@fretchen/chain-utils";
import { searchWeb, QueryError } from "./search_service.js";
import { fetchExternalHtml, FetchUrlError } from "./web_fetch_service.js";

/**
 * Owner-gated web access for /assistent: `GET /search` proxies Brave's LLM Context API,
 * `GET /fetch` retrieves one arbitrary page (see `web_fetch_service.ts`).
 *
 * The function is still deployed as `searchapi` — renaming it would change its URL, which the
 * website hard-codes — so the name is now narrower than what it does.
 *
 * Shaped after `growth_api.ts`, which is this package's template for a wallet-authenticated
 * function that is not an x402 seller: wildcard CORS, preflight answered before auth, path
 * routing, `{ error }` bodies. No `/openapi.json` and no generated spec — those exist only for the
 * two published x402 endpoints, and this one is not a product anybody else can call.
 *
 * Gated because Brave bills per query, and because an ungated `/fetch` is an open proxy anyone
 * could point at anything. The gate is a wallet signature over `search-api:<timestamp>`
 * checked against `OWNER_ETH_ADDRESS`; the prefix must match `useWalletAuth("search-api")` in the
 * browser or every request 401s on message format.
 */

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const AUTH_PREFIX = "search-api";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
  "Content-Type": "application/json",
};

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body),
  };
}

function parsePath(rawPath: string): string {
  return rawPath.replace(/^\/+/, "");
}

export async function handle(
  event: Record<string, unknown>,
  _context: unknown,
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  // CORS preflight, answered before auth — a browser sends it without the Authorization header.
  if ((event.httpMethod as string) === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS, body: "" };
  }

  const headers = event.headers as Record<string, string> | undefined;
  const auth = parseBearerToken(headers?.authorization || headers?.Authorization);
  if (!auth) {
    return jsonResponse(401, { error: "Missing or invalid Authorization header" });
  }

  // One address or a comma-separated list. An empty list authorises nobody, and that is a
  // misconfiguration rather than a rejected caller — 500, as in growth_service.ts's verifyOwner,
  // so it reads as broken rather than as "your wallet is wrong".
  const ownerAddresses = parseOwnerAddresses(process.env.OWNER_ETH_ADDRESS);
  if (ownerAddresses.length === 0) {
    logger.error("OWNER_ETH_ADDRESS not configured");
    return jsonResponse(500, { error: "Internal server error" });
  }

  const authError = await verifySignedMessage(
    auth.address,
    auth.signature,
    auth.message,
    AUTH_PREFIX,
    ownerAddresses,
  );
  if (authError) {
    return jsonResponse(401, { error: authError });
  }

  const method = event.httpMethod as string;
  const path = parsePath((event.path as string) || "");
  const queryParams = (event.queryStringParameters as Record<string, string>) || {};

  try {
    if (method === "GET" && path === "search") {
      const results = await searchWeb(queryParams.q ?? "");
      return jsonResponse(200, results);
    }

    if (method === "GET" && path === "fetch") {
      const page = await fetchExternalHtml(queryParams.url ?? "");
      return jsonResponse(200, page);
    }

    return jsonResponse(404, { error: "Not found" });
  } catch (err) {
    // A bad query or an unfetchable url is the caller's fault and worth saying precisely — the
    // model corrects itself from these. Everything else is ours or the upstream's, and stays
    // generic so an internal hostname or path cannot leak through an error string.
    if (err instanceof QueryError || err instanceof FetchUrlError) {
      return jsonResponse(400, { error: err.message });
    }
    logger.error({ err }, "Request handler error");
    return jsonResponse(500, { error: "Internal server error" });
  }
}

/* Local dev server — only when run directly: npm run dev:search */
const isEntrypoint =
  typeof process.argv[1] === "string" &&
  import.meta.url.endsWith(process.argv[1].replace(/.*\//, ""));

if (isEntrypoint && process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    const scw = await import("@scaleway/serverless-functions");
    scw.serveHandler(handle, 8084);
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
