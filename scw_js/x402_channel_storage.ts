import type { Channel, ChannelStorage, ChannelUpdateResult } from "@x402/evm/batch-settlement/server";
import {
  getS3ObjectWithMeta,
  putS3ObjectConditional,
  deleteS3Object,
  listObjects,
} from "@fretchen/s3-utils";

const PREFIX = "channels/";
const MAX_CAS_ATTEMPTS = 3;

function keyFor(channelId: string): string {
  return `${PREFIX}${channelId.toLowerCase()}.json`;
}

/**
 * S3-backed `ChannelStorage` for the batch-settlement resource server.
 * Uses conditional PUT/DELETE (If-Match / If-None-Match) for the CAS
 * guarantee the SDK requires of `updateChannel` across concurrent callers.
 */
export class S3ChannelStorage implements ChannelStorage {
  async get(channelId: string): Promise<Channel | undefined> {
    const result = await getS3ObjectWithMeta(keyFor(channelId));
    if (!result) {
      return undefined;
    }
    return JSON.parse(result.body) as Channel;
  }

  async list(): Promise<Channel[]> {
    const keys = await listObjects(PREFIX);
    const channels: Channel[] = [];
    for (const key of keys) {
      const result = await getS3ObjectWithMeta(key);
      if (result) {
        channels.push(JSON.parse(result.body) as Channel);
      }
    }
    return channels.sort((a, b) => a.channelId.localeCompare(b.channelId));
  }

  async updateChannel(
    channelId: string,
    update: (current: Channel | undefined) => Channel | undefined,
  ): Promise<ChannelUpdateResult> {
    const key = keyFor(channelId);

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

    throw new Error(`S3ChannelStorage.updateChannel: exceeded ${MAX_CAS_ATTEMPTS} CAS attempts for ${channelId}`);
  }
}
