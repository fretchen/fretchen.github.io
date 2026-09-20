import { createPublicClient, http } from "viem";
import { getViemChain, getRpcUrl } from "@fretchen/chain-utils";
import type { Channel, ChannelStorage } from "@x402/evm/batch-settlement/server";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

/** Canonical CREATE2 address of the x402BatchSettlement escrow, same on every chain. */
const BATCH_SETTLEMENT_ADDRESS = "0x4020074e9dF2ce1deE5A9C1b5c3f541D02a10003" as const;

const CHANNELS_ABI = [
  {
    type: "function",
    name: "channels",
    inputs: [{ name: "channelId", type: "bytes32" }],
    outputs: [
      { name: "balance", type: "uint128" },
      { name: "totalClaimed", type: "uint128" },
    ],
    stateMutability: "view",
  },
] as const;

/** The contract's per-channel refund nonce, which `channels()` does not return — it lives in its
 *  own getter. Selector `0xf0dc792e`. */
const REFUND_NONCE_ABI = [
  {
    type: "function",
    name: "refundNonce",
    inputs: [{ name: "channelId", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export interface ChannelSyncResult {
  channelId: string;
  storedBalance: string;
  chainBalance: string;
  storedRefundNonce: number;
  chainRefundNonce: number;
  corrected: boolean;
}

/**
 * Refresh everything the CHAIN owns on each stored channel — `balance`, `totalClaimed` and
 * `refundNonce` — before any of it is used to build a refund.
 *
 * Why this is needed before any refund: the SDK builds a refund entirely from the STORED record
 * (server/index.mjs refundChannel) — the amount from `balance - chargedCumulativeAmount`, the
 * candidate filter from `balance !== 0`, and the signature from `refundNonce`. Every one of those
 * is a cache, and each has gone stale in production:
 *
 * - **`balance`.** `handleAfterVerify` writes the facilitator's PRE-deposit reading and relies on
 *   `handleAfterSettle` to correct it, so a request that dies in between leaves a stale-low figure
 *   behind for good. Two live Optimism channels holding 1.0 and 6.5 USDC both cached `balance: 0`;
 *   refunding from that cache would have skipped them (the zero filter) or computed a NEGATIVE
 *   amount. Either way the 7.5 USDC stays locked.
 * - **`refundNonce`.** A successful refund DELETES the channel record, and a later deposit with the
 *   same voucher signer recreates it — same `channelId`, `refundNonce` back to 0, while the chain
 *   has moved to 1. Every subsequent refund is then signed against a consumed nonce and the
 *   contract reverts with `0x164f1afe`. Two Optimism channels sat like that: refunds had never
 *   worked on either, and because the SDK's `refundChannels` throws on the first failure with no
 *   per-channel catch, one of them blocked the whole sweep — including a third channel whose nonce
 *   was fine. 2.08 USDC accumulated behind it.
 *
 * That last point is the reason this function exists in its current shape: it is the one place that
 * re-reads the chain, so it is the one place that can stop a cached mirror from drifting.
 *
 * Read-only against the chain; the only writes are corrections to our own S3 records.
 */
export async function resyncChannelState(
  storage: ChannelStorage,
  network: string,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<ChannelSyncResult[]> {
  const client = createPublicClient({
    chain: getViemChain(network),
    transport: http(getRpcUrl(network)),
  });

  const channels: Channel[] = await storage.list();
  const results: ChannelSyncResult[] = [];

  for (const channel of channels) {
    let chainBalance: bigint;
    let chainTotalClaimed: bigint;
    let chainRefundNonce: bigint;
    try {
      // Both reads together: a record corrected from one and not the other would be a third
      // flavour of the same drift this function exists to prevent.
      const [channelState, refundNonce] = await Promise.all([
        client.readContract({
          address: BATCH_SETTLEMENT_ADDRESS,
          abi: CHANNELS_ABI,
          functionName: "channels",
          args: [channel.channelId as `0x${string}`],
        }) as Promise<[bigint, bigint]>,
        client.readContract({
          address: BATCH_SETTLEMENT_ADDRESS,
          abi: REFUND_NONCE_ABI,
          functionName: "refundNonce",
          args: [channel.channelId as `0x${string}`],
        }) as Promise<bigint>,
      ]);
      [chainBalance, chainTotalClaimed] = channelState;
      chainRefundNonce = refundNonce;
    } catch (err) {
      // A bad read must never overwrite a good record — leave it exactly as it is.
      logger.warn({ err, network, channelId: channel.channelId }, "Channel state read failed");
      continue;
    }

    const corrected =
      chainBalance.toString() !== channel.balance ||
      chainTotalClaimed.toString() !== channel.totalClaimed ||
      Number(chainRefundNonce) !== channel.refundNonce;

    results.push({
      channelId: channel.channelId,
      storedBalance: channel.balance,
      chainBalance: chainBalance.toString(),
      storedRefundNonce: channel.refundNonce,
      chainRefundNonce: Number(chainRefundNonce),
      corrected,
    });

    if (!corrected || dryRun) {
      continue;
    }

    await storage.updateChannel(channel.channelId, (current) =>
      current
        ? {
            ...current,
            balance: chainBalance.toString(),
            totalClaimed: chainTotalClaimed.toString(),
            refundNonce: Number(chainRefundNonce),
          }
        : current,
    );
    logger.info(
      {
        network,
        channelId: channel.channelId,
        balanceFrom: channel.balance,
        balanceTo: chainBalance.toString(),
        refundNonceFrom: channel.refundNonce,
        refundNonceTo: Number(chainRefundNonce),
      },
      "Corrected stale cached channel state",
    );
  }

  return results;
}
