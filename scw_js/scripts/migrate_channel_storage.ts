/**
 * One-off migration: move batch-settlement channel records from the old flat keyspace
 * (`channels/<id>.json`) into per-network prefixes (`channels/<network>/<id>.json`).
 *
 * Why: `ChannelStorage.list()` takes no network argument and the SDK's `Channel` record
 * carries no network field, so one flat store handed Base channels to Optimism claim
 * batches. Every batch reverted with `claim_simulation_failed` — 3 failures per run across
 * 14 runs, zero claims, while ~$7.50 of USDC accumulated unclaimed in escrow. Partitioning
 * by prefix makes `list()` correct by construction.
 *
 * Attribution is exact, not a guess: `channelId` is a hash of the EIP-712 domain, which
 * includes the chain id, so a record belongs to whichever network reproduces its stored
 * `channelId` — see `belongsToNetwork`. A record matching no network is LEFT IN PLACE and
 * reported; those predate a config change (the `withdrawDelay` 900 -> 86400 switch, say)
 * and are not safely claimable on any chain.
 *
 * Copies rather than moves: the old object is left behind so a bad run is recoverable.
 * Delete the legacy objects by hand once claims are confirmed working.
 *
 * Usage (from scw_js/):
 *   npx tsx scripts/migrate_channel_storage.ts            # dry run, prints the plan
 *   npx tsx scripts/migrate_channel_storage.ts --apply    # writes
 */
import dotenv from "dotenv";
import type { Channel } from "@x402/evm/batch-settlement/server";
import { getS3Object, putS3Object, listObjects } from "@fretchen/s3-utils";
import { belongsToNetwork, channelPrefix } from "../x402_channel_storage.js";
import { getBatchSettlementNetworks } from "../x402_server.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const LEGACY_PREFIX = "channels/";

/**
 * A legacy object is one directly under `channels/`, with no network segment — so a
 * re-run after a partial migration skips what it already moved instead of nesting it
 * a second level down.
 */
export function isLegacyKey(key: string): boolean {
  return key.startsWith(LEGACY_PREFIX) && !key.slice(LEGACY_PREFIX.length).includes("/");
}

/** The network whose EIP-712 domain reproduces this record's stored `channelId`, if any. */
export function attribute(channel: Channel, networks: readonly string[]): string | undefined {
  return networks.find((network) => belongsToNetwork(channel, network));
}

async function main(): Promise<void> {
  const networks = getBatchSettlementNetworks();
  console.log(`Networks: ${networks.join(", ")}`);
  console.log(APPLY ? "Mode: APPLY (will write)\n" : "Mode: DRY RUN (no writes)\n");

  const keys = (await listObjects(LEGACY_PREFIX)).filter(isLegacyKey);
  if (keys.length === 0) {
    console.log("No legacy channel objects found — nothing to migrate.");
    return;
  }
  console.log(`Found ${keys.length} legacy object(s).\n`);

  const unattributed: string[] = [];
  let migrated = 0;

  for (const key of keys) {
    const body = await getS3Object(key);
    if (!body) {
      console.log(`  SKIP  ${key} — could not be read`);
      continue;
    }

    let channel: Channel;
    try {
      channel = JSON.parse(body) as Channel;
    } catch {
      console.log(`  SKIP  ${key} — not valid JSON`);
      unattributed.push(key);
      continue;
    }

    const network = attribute(channel, networks);
    if (!network) {
      console.log(
        `  LEFT  ${key} — matches no network (channelId ${channel.channelId}); ` +
          `likely predates a channelConfig change, not claimable anywhere`,
      );
      unattributed.push(key);
      continue;
    }

    const target = `${channelPrefix(network)}${channel.channelId.toLowerCase()}.json`;
    // USDC is 6 decimals; these figures are small enough that Number is exact here.
    const usdc = (atomic: string) => (Number(atomic) / 1e6).toFixed(6);
    console.log(
      `  MOVE  ${key}\n        -> ${target}` +
        `\n        balance=${usdc(channel.balance)} charged=${usdc(channel.chargedCumulativeAmount)} ` +
        `claimed=${usdc(channel.totalClaimed)} USDC`,
    );

    if (APPLY) {
      await putS3Object(target, body, { contentType: "application/json" });
    }
    migrated += 1;
  }

  console.log(
    `\n${APPLY ? "Migrated" : "Would migrate"} ${migrated} object(s); ` +
      `${unattributed.length} left in place.`,
  );
  if (!APPLY) {
    console.log("Re-run with --apply to write. The legacy objects are copied, never deleted.");
  }
}

// Guarded so the helpers above can be imported by tests without running a migration.
if (process.argv[1]?.endsWith("migrate_channel_storage.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
