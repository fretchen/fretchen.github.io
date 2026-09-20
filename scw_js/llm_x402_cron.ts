import pino from "pino";
import { createPublicClient, http } from "viem";
import { getUSDCConfig, getViemChain, getRpcUrl } from "@fretchen/chain-utils";
import {
  createLLMResourceServer,
  createFacilitatorClient,
  getBatchSettlementNetworks,
  getFacilitatorFeeConfig,
  useEnhancedRefundRequirements,
  type FacilitatorFeeConfig,
} from "./x402_server.js";
import { resyncChannelState } from "./x402_channel_sync.js";
import type { Channel } from "@x402/evm/batch-settlement/server";
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

/**
 * How long a channel must sit untouched before the cooperative refund sweep returns its
 * unspent escrow to the payer.
 *
 * Kept below WITHDRAW_DELAY_SECONDS (86400) on purpose: the buyers page promises escrow is
 * "withdrawable after ~24 hours", and that unilateral exit should be the worst case, not the
 * only way out. Sweeping at 6h means a channel that goes quiet is normally refunded long
 * before anyone needs to wait out the delay themselves.
 */
const REFUND_IDLE_SECS = Number(process.env.LLM_REFUND_IDLE_SECONDS ?? "21600");

interface NetworkResult {
  network: string;
  claims?: number;
  settled?: boolean;
  /** Idle channels cooperatively refunded this run. */
  refunds?: number;
  /** Set when the refund sweep failed; never masks an otherwise successful claim. */
  refundError?: string;
  /** How many more claims the current fee approval covers, when it could be read. */
  feeAllowanceClaimsLeft?: number;
  /** Cached channel records that disagreed with the chain and were corrected. Reported, not
   *  escalated: the repair is the design, but drift means something upstream is wrong. */
  driftCorrected?: number;
  /** Escrow this network's channels still hold, in USDC atomic units. Context for the check
   *  below, not a condition of its own. */
  escrowHeld?: string;
  /** Channels that should have been refunded by now and were not — see assertSweptClean. */
  stuckChannels?: string[];
  error?: string;
}

/**
 * The sweep's own post-condition: after a run, no channel idle past `REFUND_IDLE_SECS` should
 * still be holding refundable escrow.
 *
 * This is the check that would have caught the incident this file's comments describe, and it
 * would have caught it without anyone knowing what was wrong. Refunds failed for four unrelated
 * reasons over the same period — a stale cached `balance`, a stale `refundNonce`, a
 * `refund_transaction_failed` on Base, a `withdraw_delay_mismatch` on Base Sepolia — and every one
 * of them presents identically here: escrow that should have gone home and did not. A check
 * written against the *outcome* survives the causes.
 *
 * Deliberately binary, with no threshold to tune: either the sweep did its job or it did not.
 */
function findStuckChannels(channels: Channel[]): string[] {
  const idleBefore = Date.now() - REFUND_IDLE_SECS * 1000;
  return channels
    .filter((c) => c.lastRequestTimestamp < idleBefore)
    .filter((c) => BigInt(c.balance) > BigInt(c.chargedCumulativeAmount))
    .map((c) => c.channelId);
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
  usdcAddress: `0x${string}`,
  fee: FacilitatorFeeConfig,
): Promise<number | null> {
  try {
    const publicClient = createPublicClient({
      chain: getViemChain(network),
      transport: http(getRpcUrl(network)),
    });
    const allowance = await publicClient.readContract({
      address: usdcAddress,
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

  let schemeFor: ReturnType<typeof createLLMResourceServer>["schemeFor"];
  try {
    ({ schemeFor } = createLLMResourceServer(receiverAddress));
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
    // Pass the token explicitly on EVERY network, not just Optimism. Omitting it makes
    // the SDK fall back to its `DEFAULT_STABLECOINS` registry, which still has no
    // "eip155:10" entry (see BATCH_SETTLEMENT_NETWORKS in x402_server.ts) and throws
    // "No default asset configured for network eip155:10". On Base the explicit value is
    // identical to the registry's, so a uniform call site costs nothing and can't
    // silently regress the way a network-conditional one could.
    const usdcAddress = getUSDCConfig(network).address as `0x${string}`;

    // Checked BEFORE the claim, deliberately: if the claim is about to fail for lack of
    // allowance, this is the run where the warning is most needed.
    let claimsLeft: number | null = null;
    if (feeConfig) {
      claimsLeft = await readFeeAllowanceClaimsLeft(
        receiverAddress,
        network,
        usdcAddress,
        feeConfig,
      );
      if (claimsLeft !== null && BigInt(claimsLeft) < LOW_ALLOWANCE_CLAIMS) {
        logger.warn(
          {
            network,
            claimsLeft,
            receiver: receiverAddress,
            spender: feeConfig.recipient,
            asset: usdcAddress,
          },
          "Fee allowance nearly exhausted — approve more USDC for the facilitator, or claims " +
            "will start failing with insufficient_fee_allowance",
        );
      }
    }

    try {
      // Per-network scheme: its storage is scoped to this network's S3 prefix, so
      // `list()` cannot hand another chain's channels to this chain's claim batch.
      const scheme = schemeFor(network);
      const manager = scheme.createChannelManager(
        facilitatorClient,
        network as `${string}:${string}`,
        usdcAddress,
      );
      const { claims, settle } = await manager.claimAndSettle();
      logger.info({ network, claims, settle }, "claimAndSettle completed");

      // Cooperative refund of channels that have gone quiet, after the claim so the two
      // stay independent: refunding a channel with outstanding vouchers would otherwise be
      // submitted as an enriched refund (multicall([claim, refund])) and tangle the fee
      // accounting. `refundIdleChannels` calls `storage.list()` itself, which is safe only
      // because the storage is network-scoped — on a shared store it would sweep every
      // chain's channels into this chain's refunds. Its own try/catch, so a refund failure
      // never hides a good claim.
      let refunds: number | undefined;
      let refundError: string | undefined;
      let driftCorrected: number | undefined;
      try {
        // The SDK builds a refund entirely from the stored record — amount, candidate filter and
        // signing nonce — and all three are caches that have gone stale in production. A stale
        // `balance` skips a funded channel or computes a negative amount; a stale `refundNonce`
        // signs against a nonce the chain already consumed, which reverts and, because the SDK's
        // refund loop has no per-channel catch, blocks every other refund in the sweep behind it.
        // 2.08 USDC accumulated that way. See resyncChannelState.
        const synced = await resyncChannelState(scheme.getStorage(), network);
        driftCorrected = synced.filter((s) => s.corrected).length;
        if (driftCorrected > 0) {
          // Warn, not info: the repair working is the design, but a record that disagreed with
          // the chain means something upstream wrote it wrong. The stale refundNonce was being
          // corrected on every run, at info level, while refunds failed for weeks.
          logger.warn(
            { network, driftCorrected, of: synced.length },
            "Cached channel state had drifted from the chain and was corrected",
          );
        }
        // The SDK builds refund requirements with `extra: {}`, which the facilitator rejects
        // as receiver_authorizer_mismatch. Applied after the claim so claim/settle are
        // untouched. See useEnhancedRefundRequirements.
        await useEnhancedRefundRequirements(scheme, manager, {
          network,
          asset: usdcAddress,
          payTo: receiverAddress,
        });
        refunds = (await manager.refundIdleChannels({ idleSecs: REFUND_IDLE_SECS })).length;
        logger.info({ network, refunds }, "Refund sweep completed");
      } catch (err) {
        refundError = (err as Error).message;
        logger.error({ err, network }, "Refund sweep failed");
      }

      // The sweep's post-condition, checked against storage as it now stands. Runs even when the
      // refund step threw: a failed sweep is exactly when escrow is most likely left behind.
      const remaining = await scheme.getStorage().list();
      const escrowHeld = remaining.reduce((sum, c) => sum + BigInt(c.balance), 0n);
      const stuckChannels = findStuckChannels(remaining);
      if (stuckChannels.length > 0) {
        logger.error(
          { network, stuckChannels, escrowHeld: escrowHeld.toString() },
          "Channels are past the refund threshold and still hold escrow — the sweep did not do its job",
        );
      }

      results.push({
        network,
        claims: claims.length,
        settled: settle !== undefined,
        ...(refunds !== undefined && { refunds }),
        ...(refundError !== undefined && { refundError }),
        ...(driftCorrected !== undefined && { driftCorrected }),
        ...(claimsLeft !== null && { feeAllowanceClaimsLeft: claimsLeft }),
        escrowHeld: escrowHeld.toString(),
        ...(stuckChannels.length > 0 && { stuckChannels }),
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

  // Every way this run can have failed, not just the one that throws.
  //
  // `refundError` used to be invisible here: it is a different key from `error`, so a run that
  // claimed correctly and refunded nothing returned 200 and Scaleway recorded a successful
  // invocation. That is how a broken refund sweep ran twice a day for weeks without anyone
  // noticing. `stuckChannels` is the outcome-level version of the same signal, and catches the
  // cases where nothing threw at all.
  const hasErrors = results.some(
    (r) =>
      r.error !== undefined || r.refundError !== undefined || (r.stuckChannels?.length ?? 0) > 0,
  );
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
