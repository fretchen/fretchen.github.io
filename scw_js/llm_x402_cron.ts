import pino from "pino";
import { createLLMResourceServer, createFacilitatorClient, getBatchSettlementNetworks } from "./x402_server.js";
import type { ScwEvent } from "./types.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

function isHexAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

interface NetworkResult {
  network: string;
  claims?: number;
  settled?: boolean;
  error?: string;
}

/**
 * Scheduled sweep: claims accumulated vouchers and settles claimed funds to the
 * receiver wallet, for every batch-settlement network. Reads the same S3
 * `ChannelStorage` that `sc_llm_x402.ts` writes to — this is the only place
 * batch-settlement channels actually move funds on-chain (per-message vouchers
 * settled by the handler are a local bookkeeping commit only, no chain tx).
 */
export async function handle(
  _: ScwEvent,
  _context: unknown,
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  const headers = { "Content-Type": "application/json" };

  const receiverAddress = process.env.NFT_WALLET_PUBLIC_KEY;
  if (!receiverAddress || !isHexAddress(receiverAddress)) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          "Service provider address not configured or invalid. Set NFT_WALLET_PUBLIC_KEY to a 0x-prefixed 40-hex-char address.",
      }),
    };
  }

  let scheme: ReturnType<typeof createLLMResourceServer>["scheme"];
  try {
    ({ scheme } = createLLMResourceServer(receiverAddress));
  } catch (err) {
    logger.error({ err }, "Failed to configure batch-settlement resource server");
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error" }) };
  }

  const facilitatorClient = createFacilitatorClient();
  const results: NetworkResult[] = [];

  for (const network of getBatchSettlementNetworks()) {
    try {
      const manager = scheme.createChannelManager(facilitatorClient, network as `${string}:${string}`);
      const { claims, settle } = await manager.claimAndSettle();
      logger.info({ network, claims, settle }, "claimAndSettle completed");
      results.push({ network, claims: claims.length, settled: settle !== undefined });
    } catch (err) {
      logger.error({ err, network }, "claimAndSettle failed");
      results.push({ network, error: (err as Error).message });
    }
  }

  const hasErrors = results.some((r) => r.error !== undefined);
  return {
    statusCode: hasErrors ? 500 : 200,
    headers,
    body: JSON.stringify({ results }),
  };
}

if (process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();
    const scw_fnc_node = await import("@scaleway/serverless-functions");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scw_fnc_node.serveHandler(handle as any, 8084);
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
