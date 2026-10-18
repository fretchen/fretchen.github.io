import type {
  Channel,
  ChannelStorage,
  ChannelUpdateResult,
} from "@x402/evm/batch-settlement/server";
// `computeChannelId` is only exported from the *client* subpath (the server subpath exports
// just BatchSettlementChannelManager / BatchSettlementEvmScheme / InMemoryChannelStorage).
// It is a pure hashTypedData helper with no browser dependency, so importing it server-side
// is deliberate, not a mistake.
import { computeChannelId } from "@x402/evm/batch-settlement/client";
import {
  getS3ObjectWithMeta,
  putS3ObjectConditional,
  deleteS3Object,
  listObjects,
} from "@fretchen/s3-utils";
import { logger } from "./logger.js";

const PREFIX = "channels/";
const MAX_CAS_ATTEMPTS = 3;

/**
 * S3 prefix holding one network's channels, e.g. `channels/eip155:10/`.
 *
 * Channels are partitioned by network because `list()` has no other way to tell them apart:
 * the SDK's `Channel` record carries no network field, and `BatchSettlementChannelManager`
 * claims whatever `list()` returns against the one chain it was constructed for. A flat
 * keyspace therefore fed Base channels into Optimism claim batches, every batch reverted with
 * `claim_simulation_failed`, and no claim or refund landed for as long as the cron ran.
 */
export function channelPrefix(network: string): string {
  return `${PREFIX}${network}/`;
}

/**
 * Whether a stored record actually belongs to `network`.
 *
 * `channelId` is a hash of the EIP-712 domain, which includes the chain id, so recomputing it
 * from `channelConfig` is a complete check — a record that lands under the wrong prefix cannot
 * fake a match. Used both as `list()`'s read-time guard and as the migration's attribution rule.
 */
export function belongsToNetwork(channel: Channel, network: string): boolean {
  try {
    return (
      computeChannelId(channel.channelConfig, network as `${string}:${string}`).toLowerCase() ===
      channel.channelId.toLowerCase()
    );
  } catch {
    // Malformed channelConfig: not attributable to any network.
    return false;
  }
}

/**
 * S3-backed `ChannelStorage` for the batch-settlement resource server, scoped to one network.
 * Uses conditional PUT/DELETE (If-Match / If-None-Match) for the CAS
 * guarantee the SDK requires of `updateChannel` across concurrent callers.
 *
 * One instance per network — see `createLLMResourceServer`, which registers a separate scheme
 * per network so both the serving path and the claim cron reach the right prefix.
 *
 * USDC and EURC channels share a network's prefix (the token is part of `channelId`, so they
 * never collide). The optional `token` makes `list()` a single-token view for the claim cron:
 * the SDK's channel manager claims EVERY channel `list()` returns and settles them all in its
 * one token, and the facilitator refuses a claim batch that mixes tokens — so an unfiltered
 * list would fail every claim on a network with both. Reads and writes by id are unaffected.
 */
export class S3ChannelStorage implements ChannelStorage {
  private readonly prefix: string;

  constructor(
    private readonly network: string,
    private readonly token?: string,
  ) {
    this.prefix = channelPrefix(network);
  }

  private keyFor(channelId: string): string {
    return `${this.prefix}${channelId.toLowerCase()}.json`;
  }

  async get(channelId: string): Promise<Channel | undefined> {
    const result = await getS3ObjectWithMeta(this.keyFor(channelId));
    if (!result) {
      return undefined;
    }
    return JSON.parse(result.body) as Channel;
  }

  async list(): Promise<Channel[]> {
    const keys = await listObjects(this.prefix);
    const channels: Channel[] = [];
    for (const key of keys) {
      const result = await getS3ObjectWithMeta(key);
      if (!result) {
        continue;
      }
      const channel = JSON.parse(result.body) as Channel;
      // A misfiled object would be claimed against the wrong chain and revert the whole
      // batch, taking every well-filed channel down with it. Skip it loudly instead.
      if (!belongsToNetwork(channel, this.network)) {
        logger.warn(
          { key, network: this.network, channelId: channel.channelId },
          "Skipping channel filed under the wrong network prefix",
        );
        continue;
      }
      if (this.token && channel.channelConfig.token.toLowerCase() !== this.token.toLowerCase()) {
        continue;
      }
      channels.push(channel);
    }
    return channels.sort((a, b) => a.channelId.localeCompare(b.channelId));
  }

  async updateChannel(
    channelId: string,
    update: (current: Channel | undefined) => Channel | undefined,
  ): Promise<ChannelUpdateResult> {
    const key = this.keyFor(channelId);

    for (let attempt = 1; attempt <= MAX_CAS_ATTEMPTS; attempt++) {
      const existing = await getS3ObjectWithMeta(key);
      const current = existing ? (JSON.parse(existing.body) as Channel) : undefined;

      const next = update(current);
      if (next === current) {
        return { channel: current, status: "unchanged" };
      }

      if (!next) {
        const result = await deleteS3Object(key, existing ? { ifMatch: existing.etag } : {});
        if (result.ok) {
          return { channel: undefined, status: current ? "deleted" : "unchanged" };
        }
        continue;
      }

      const body = JSON.stringify(next);
      const putResult = await putS3ObjectConditional(key, body, {
        contentType: "application/json",
        ...(existing ? { ifMatch: existing.etag } : { ifNoneMatch: "*" }),
      });
      if (putResult.ok) {
        return { channel: next, status: "updated" };
      }
      // 412 precondition failure: another writer won the race — retry from a fresh read.
    }

    throw new Error(
      `S3ChannelStorage.updateChannel: exceeded ${MAX_CAS_ATTEMPTS} CAS attempts for ${channelId}`,
    );
  }
}
