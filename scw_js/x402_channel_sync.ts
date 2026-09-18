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

export interface ChannelSyncResult {
  channelId: string;
  storedBalance: string;
  chainBalance: string;
  corrected: boolean;
}

/**
 * Refresh each stored channel's `balance`/`totalClaimed` from the escrow contract.
 *
 * Why this is needed before any refund: the SDK computes a refund as
 * `balance - chargedCumulativeAmount` from the STORED record (server/index.mjs refundChannel),
 * and filters refund candidates on `balance !== 0`. The stored balance is only a cache —
 * `handleAfterVerify` writes the facilitator's PRE-deposit reading and relies on
 * `handleAfterSettle` to correct it afterwards, so any request that dies in between leaves a
 * stale-low figure behind for good.
 *
 * That is not hypothetical: two live Optimism channels holding 1.0 and 6.5 USDC both cached
 * `balance: "0"`. Refunding from that cache would have skipped them entirely (the zero
 * filter) or computed a NEGATIVE refund amount (0 - chargedCumulative). Either way the 7.5
 * USDC stays locked.
 *
 * Read-only against the chain; the only writes are corrections to our own S3 records.
 */
export async function resyncChannelBalances(
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
    try {
      [chainBalance, chainTotalClaimed] = (await client.readContract({
        address: BATCH_SETTLEMENT_ADDRESS,
        abi: CHANNELS_ABI,
        functionName: "channels",
        args: [channel.channelId as `0x${string}`],
      })) as [bigint, bigint];
    } catch (err) {
      // A bad read must never overwrite a good record — leave it exactly as it is.
      logger.warn({ err, network, channelId: channel.channelId }, "Channel state read failed");
      continue;
    }

    const corrected =
      chainBalance.toString() !== channel.balance ||
      chainTotalClaimed.toString() !== channel.totalClaimed;

    results.push({
      channelId: channel.channelId,
      storedBalance: channel.balance,
      chainBalance: chainBalance.toString(),
      corrected,
    });

    if (!corrected || dryRun) {continue;}

    await storage.updateChannel(channel.channelId, (current) =>
      current
        ? {
            ...current,
            balance: chainBalance.toString(),
            totalClaimed: chainTotalClaimed.toString(),
          }
        : current,
    );
    logger.info(
      {
        network,
        channelId: channel.channelId,
        from: channel.balance,
        to: chainBalance.toString(),
      },
      "Corrected stale cached channel balance",
    );
  }

  return results;
}
