/**
 * One-off recovery: claim what the seller has earned on a network's channels, then
 * cooperatively refund the rest of the escrow to the payers.
 *
 * Why this exists: the claim cron ran every 12h for months against a channel store that was
 * not network-aware, so every batch reverted with `claim_simulation_failed` and the escrow
 * at 0x4020074e…0003 received 16 deposits and made zero outbound transfers. ~$7.50 of USDC
 * is sitting there against ~$0.10 of real usage. The cron fix stops the bleeding; this
 * releases what is already stuck.
 *
 * It is deliberately the same two calls the fixed cron makes (`claimAndSettle` then
 * `refundIdleChannels`), just with `idleSecs: 0` so nothing is skipped for being recent.
 * Run it AFTER `migrate_channel_storage.ts --apply`, so it reads through the per-network
 * layout that production will use — recovery then exercises the real code path, not a
 * one-off one.
 *
 * Needs the production environment: NFT_WALLET_PUBLIC_KEY, RECEIVER_AUTHORIZER_PRIVATE_KEY,
 * SCW_ACCESS_KEY / SCW_SECRET_KEY, and the RPC_URL_* for the target network.
 *
 * Usage (from scw_js/):
 *   npx tsx scripts/recover_channels.ts eip155:10             # dry run: lists channels only
 *   npx tsx scripts/recover_channels.ts eip155:10 --apply     # claims, then refunds
 */
import dotenv from "dotenv";
import { getUSDCConfig } from "@fretchen/chain-utils";
import {
  createLLMResourceServer,
  createFacilitatorClient,
  getBatchSettlementNetworks,
  useEnhancedRefundRequirements,
} from "../x402_server.js";
import { resyncChannelState } from "../x402_channel_sync.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const network = process.argv[2];

function usdc(atomic: string | bigint): string {
  return (Number(atomic) / 1e6).toFixed(6);
}

async function main(): Promise<void> {
  const networks = getBatchSettlementNetworks();
  if (!network || !networks.includes(network)) {
    console.error(`Usage: npx tsx scripts/recover_channels.ts <network> [--apply]`);
    console.error(`Networks: ${networks.join(", ")}`);
    process.exit(1);
  }

  const receiver = process.env.NFT_WALLET_PUBLIC_KEY;
  if (!receiver || !/^0x[a-fA-F0-9]{40}$/.test(receiver)) {
    console.error("NFT_WALLET_PUBLIC_KEY missing or not a 0x-prefixed 40-hex-char address.");
    process.exit(1);
  }

  const { schemeFor } = createLLMResourceServer(receiver as `0x${string}`);
  const scheme = schemeFor(network);
  const manager = scheme.createChannelManager(
    createFacilitatorClient(),
    network as `${string}:${string}`,
    getUSDCConfig(network).address as `0x${string}`,
  );

  console.log(`Network: ${network}`);
  console.log(APPLY ? "Mode: APPLY (will move funds)\n" : "Mode: DRY RUN (no writes)\n");

  // MUST run before any refund. The stored `balance` is a cache that goes stale-low, and the
  // SDK refunds `balance - chargedCumulativeAmount` from it — a stale zero either skips the
  // channel (the balance!==0 filter) or computes a negative amount. Two live Optimism
  // channels holding 1.0 and 6.5 USDC both cached "0".
  console.log("Re-syncing cached channel state from chain...");
  const synced = await resyncChannelState(scheme.getStorage(), network, { dryRun: !APPLY });
  for (const s of synced) {
    if (!s.corrected) continue;
    // One entry per term of resyncChannelState's `corrected` predicate, so a corrected channel
    // can never print as a bare id with nothing after it.
    const drifted: string[] = [];
    if (s.storedBalance !== s.chainBalance) {
      drifted.push(`balance ${usdc(s.storedBalance)} -> ${usdc(s.chainBalance)} USDC`);
    }
    if (s.storedTotalClaimed !== s.chainTotalClaimed) {
      drifted.push(
        `totalClaimed ${usdc(s.storedTotalClaimed)} -> ${usdc(s.chainTotalClaimed)} USDC`,
      );
    }
    // A stale nonce is the difference between a refund that works and one that reverts, so it is
    // reported as its own line rather than folded into a generic "was stale".
    if (s.storedRefundNonce !== s.chainRefundNonce) {
      drifted.push(`refundNonce ${s.storedRefundNonce} -> ${s.chainRefundNonce}`);
    }
    console.log(
      `  ${s.channelId.slice(0, 18)}…  ${drifted.join(", ")}` +
        (APPLY ? "" : "  (dry run: not written)"),
    );
  }
  console.log(`  ${synced.filter((s) => s.corrected).length} of ${synced.length} were stale.\n`);

  // Network-scoped after the storage fix, so this is only this chain's channels. Re-read so
  // the figures below reflect any corrections just written.
  const channels = await scheme.getStorage().list();
  console.log(`${channels.length} channel(s):\n`);

  // In dry-run nothing was written, so the stored balances are still stale. Report the chain
  // figure from the sync instead — a totals line showing the stale cache would understate the
  // recoverable escrow by exactly the amount we are here to recover.
  const chainBalanceOf = new Map(synced.map((s) => [s.channelId, s.chainBalance]));

  let totalBalance = 0n;
  let totalOutstanding = 0n;
  for (const c of channels) {
    const balance = chainBalanceOf.get(c.channelId) ?? c.balance;
    const outstanding = BigInt(c.chargedCumulativeAmount) - BigInt(c.totalClaimed);
    totalBalance += BigInt(balance);
    totalOutstanding += outstanding > 0n ? outstanding : 0n;
    console.log(
      `  ${c.channelId}\n    payer=${c.channelConfig.payer}` +
        `\n    balance=${usdc(balance)} (on-chain) charged=${usdc(c.chargedCumulativeAmount)} ` +
        `claimed=${usdc(c.totalClaimed)} outstanding=${usdc(outstanding)} USDC` +
        `\n    refund would return ${usdc(BigInt(balance) - BigInt(c.chargedCumulativeAmount))} USDC` +
        `\n    lastRequest=${new Date(c.lastRequestTimestamp).toISOString()}`,
    );
  }
  console.log(
    `\nTotals: escrow ${usdc(totalBalance)} USDC on-chain, claimable ${usdc(totalOutstanding)} USDC.`,
  );

  if (!APPLY) {
    console.log("\nRe-run with --apply to claim and refund.");
    return;
  }

  // Claim first: refunding a channel with outstanding vouchers is submitted as an enriched
  // refund (multicall([claim, refund])), which tangles the fee accounting. Claiming
  // separately keeps the two transactions independent and easy to verify on-chain.
  console.log("\nClaiming...");
  const { claims, settle } = await manager.claimAndSettle();
  console.log(`  ${claims.length} claim tx(s): ${JSON.stringify(claims)}`);
  console.log(`  settle: ${JSON.stringify(settle)}`);

  // The SDK builds its refund requirements with `extra: {}`, which the facilitator rejects as
  // receiver_authorizer_mismatch. Applied after the claim so claim/settle are untouched.
  await useEnhancedRefundRequirements(scheme, manager, {
    network,
    asset: getUSDCConfig(network).address,
    payTo: receiver,
  });

  // idleSecs: 0 — recover everything, including channels used minutes ago. The cron uses a
  // 6h threshold; here we deliberately want no channel skipped.
  console.log("\nRefunding...");
  const refunds = await manager.refundIdleChannels({ idleSecs: 0 });
  console.log(`  ${refunds.length} refund tx(s): ${JSON.stringify(refunds)}`);

  console.log(
    "\nVerify on-chain: the escrow 0x4020074e9dF2ce1deE5A9C1b5c3f541D02a10003 should now " +
      "show its first outbound transfers, and each payer should have received its remainder.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
