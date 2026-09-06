import pino from "pino";
import { createPublicClient, http } from "viem";
import { getUSDCConfig, getViemChain, getRpcUrl } from "@fretchen/chain-utils";
import {
  createLLMResourceServer,
  createFacilitatorClient,
  getBatchSettlementNetworks,
  getFacilitatorFeeConfig,
  type FacilitatorFeeConfig,
} from "./x402_server.js";
import type { ScwEvent } from "./types.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const ERC20_ALLOWANCE_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/**
 * Warn once the approval covers fewer than this many claims.
 *
 * This cron runs twice a day, so ten claims is roughly five days of notice — enough to
 * re-approve before collection actually stalls.
 */
const LOW_ALLOWANCE_CLAIMS = 10n;

function isHexAddress(addr: unknown): addr is `0x${string}` {
  return typeof addr === "string" && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

interface NetworkResult {
  network: string;
  claims?: number;
  settled?: boolean;
  /** How many more claims the current fee approval covers, when it could be read. */
  feeAllowanceClaimsLeft?: number;
  error?: string;
}

/**
 * How many more claims this receiver's USDC approval for the facilitator covers.
 *
 * Why this exists: `claim`/`settle` skip `/verify` entirely, so — unlike the `exact`
 * scheme, which gets `remainingSettlements` back from every verify — this path has no
 * built-in early warning. Without this check the approval simply runs out one day and
 * claims start failing with `insufficient_fee_allowance`, with nothing said beforehand.
 *
 * Advisory only: returns null rather than throwing on any RPC or decoding failure, so a
 * bad reading can never cost us a claim.
 */
async function readFeeAllowanceClaimsLeft(
  receiver: `0x${string}`,
  network: string,
  fee: FacilitatorFeeConfig,
): Promise<number | null> {
  try {
    const publicClient = createPublicClient({
      chain: getViemChain(network),
      transport: http(getRpcUrl(network)),
    });
    const allowance = await publicClient.readContract({
      address: getUSDCConfig(network).address as `0x${string}`,
      abi: ERC20_ALLOWANCE_ABI,
      functionName: "allowance",
      args: [receiver, fee.recipient],
    });
    return Number(allowance / fee.flatFee);
  } catch (err) {
    logger.debug({ err, network }, "Could not read fee allowance — skipping the low-balance check");
    return null;
  }
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  const facilitatorClient = createFacilitatorClient();
  const results: NetworkResult[] = [];

  // Null when the facilitator charges no fee (or could not be reached) — then there is no
  // allowance to run out and the check below is skipped entirely.
  const feeConfig = await getFacilitatorFeeConfig();

  for (const network of getBatchSettlementNetworks()) {
    // Checked BEFORE the claim, deliberately: if the claim is about to fail for lack of
    // allowance, this is the run where the warning is most needed.
    let claimsLeft: number | null = null;
    if (feeConfig) {
      claimsLeft = await readFeeAllowanceClaimsLeft(receiverAddress, network, feeConfig);
      if (claimsLeft !== null && BigInt(claimsLeft) < LOW_ALLOWANCE_CLAIMS) {
        logger.warn(
          {
            network,
            claimsLeft,
            receiver: receiverAddress,
            spender: feeConfig.recipient,
            asset: getUSDCConfig(network).address,
          },
          "Fee allowance nearly exhausted — approve more USDC for the facilitator, or claims " +
            "will start failing with insufficient_fee_allowance",
        );
      }
    }

    try {
      // Pass the token explicitly on EVERY network, not just Optimism. Omitting it makes
      // the SDK fall back to its `DEFAULT_STABLECOINS` registry, which still has no
      // "eip155:10" entry (see BATCH_SETTLEMENT_NETWORKS in x402_server.ts) and throws
      // "No default asset configured for network eip155:10". On Base the explicit value is
      // identical to the registry's, so a uniform call site costs nothing and can't
      // silently regress the way a network-conditional one could.
      const manager = scheme.createChannelManager(
        facilitatorClient,
        network as `${string}:${string}`,
        getUSDCConfig(network).address,
      );
      const { claims, settle } = await manager.claimAndSettle();
      logger.info({ network, claims, settle }, "claimAndSettle completed");
      results.push({
        network,
        claims: claims.length,
        settled: settle !== undefined,
        ...(claimsLeft !== null && { feeAllowanceClaimsLeft: claimsLeft }),
      });
    } catch (err) {
      logger.error({ err, network }, "claimAndSettle failed");
      results.push({
        network,
        error: (err as Error).message,
        ...(claimsLeft !== null && { feeAllowanceClaimsLeft: claimsLeft }),
      });
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
