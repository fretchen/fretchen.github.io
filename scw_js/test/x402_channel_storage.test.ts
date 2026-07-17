import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Channel } from "@x402/evm/batch-settlement/server";

// ===== Mocks (vi.hoisted ensures these are available when vi.mock factories run) =====

const { mockGetS3ObjectWithMeta, mockPutS3ObjectConditional, mockDeleteS3Object, mockListObjects } =
  vi.hoisted(() => ({
    mockGetS3ObjectWithMeta: vi.fn(),
    mockPutS3ObjectConditional: vi.fn(),
    mockDeleteS3Object: vi.fn(),
    mockListObjects: vi.fn(),
  }));

vi.mock("@fretchen/s3-utils", () => ({
  getS3ObjectWithMeta: mockGetS3ObjectWithMeta,
  putS3ObjectConditional: mockPutS3ObjectConditional,
  deleteS3Object: mockDeleteS3Object,
  listObjects: mockListObjects,
}));

// ===== Import after mocks =====

import { S3ChannelStorage } from "../x402_channel_storage.js";

// ===== Helpers =====

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    channelId: "0xChannel1",
    channelConfig: {} as Channel["channelConfig"],
    chargedCumulativeAmount: "0",
    signedMaxClaimable: "10000",
    signature: "0xsig",
    balance: "10000",
    totalClaimed: "0",
    withdrawRequestedAt: 0,
    refundNonce: 0,
    lastRequestTimestamp: Date.now(),
    ...overrides,
  };
}

// ===== Tests =====

describe("S3ChannelStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get", () => {
    it("returns undefined when the object is missing", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(null);
      const storage = new S3ChannelStorage();
      const result = await storage.get("0xChannel1");
      expect(result).toBeUndefined();
    });

    it("returns the parsed channel and lowercases the key", async () => {
      const channel = makeChannel();
      mockGetS3ObjectWithMeta.mockResolvedValue({
        body: JSON.stringify(channel),
        etag: '"etag-1"',
      });
      const storage = new S3ChannelStorage();
      const result = await storage.get("0xChannel1");
      expect(result).toEqual(channel);
      expect(mockGetS3ObjectWithMeta).toHaveBeenCalledWith("channels/0xchannel1.json");
    });
  });

  describe("list", () => {
    it("returns an empty array when there are no keys", async () => {
      mockListObjects.mockResolvedValue([]);
      const storage = new S3ChannelStorage();
      const result = await storage.list();
      expect(result).toEqual([]);
    });

    it("fetches every key and returns channels sorted by channelId", async () => {
      const channelB = makeChannel({ channelId: "0xBBB" });
      const channelA = makeChannel({ channelId: "0xAAA" });
      mockListObjects.mockResolvedValue(["channels/0xbbb.json", "channels/0xaaa.json"]);
      mockGetS3ObjectWithMeta.mockImplementation(async (key: string) => {
        if (key === "channels/0xbbb.json") return { body: JSON.stringify(channelB), etag: '"e1"' };
        if (key === "channels/0xaaa.json") return { body: JSON.stringify(channelA), etag: '"e2"' };
        return null;
      });
      const storage = new S3ChannelStorage();
      const result = await storage.list();
      expect(result.map((c) => c.channelId)).toEqual(["0xAAA", "0xBBB"]);
    });
  });

  describe("updateChannel", () => {
    it("creates a new channel with If-None-Match when none exists", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(null);
      mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"new-etag"' });

      const storage = new S3ChannelStorage();
      const newChannel = makeChannel();
      const result = await storage.updateChannel("0xChannel1", () => newChannel);

      expect(result).toEqual({ channel: newChannel, status: "updated" });
      const [key, , opts] = mockPutS3ObjectConditional.mock.calls[0];
      expect(key).toBe("channels/0xchannel1.json");
      expect(opts.ifNoneMatch).toBe("*");
      expect(opts.ifMatch).toBeUndefined();
    });

    it("updates an existing channel with If-Match on its current etag", async () => {
      const current = makeChannel();
      mockGetS3ObjectWithMeta.mockResolvedValue({
        body: JSON.stringify(current),
        etag: '"etag-1"',
      });
      mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"etag-2"' });

      const storage = new S3ChannelStorage();
      const updated = { ...current, chargedCumulativeAmount: "500" };
      const result = await storage.updateChannel("0xChannel1", () => updated);

      expect(result).toEqual({ channel: updated, status: "updated" });
      const [, , opts] = mockPutS3ObjectConditional.mock.calls[0];
      expect(opts.ifMatch).toBe('"etag-1"');
    });

    it("returns unchanged without writing when the callback returns the same reference", async () => {
      const current = makeChannel();
      mockGetS3ObjectWithMeta.mockResolvedValue({
        body: JSON.stringify(current),
        etag: '"etag-1"',
      });

      const storage = new S3ChannelStorage();
      // Since get() re-parses JSON, "current" as seen by the callback is a fresh object;
      // returning it back by reference is what the SDK contract means by "unchanged".
      const result = await storage.updateChannel("0xChannel1", (c) => c);

      expect(result.status).toBe("unchanged");
      expect(mockPutS3ObjectConditional).not.toHaveBeenCalled();
    });

    it("retries from a fresh read on a 412 CAS conflict, then succeeds", async () => {
      const staleChannel = makeChannel({ chargedCumulativeAmount: "100" });
      const freshChannel = makeChannel({ chargedCumulativeAmount: "200" });
      mockGetS3ObjectWithMeta
        .mockResolvedValueOnce({ body: JSON.stringify(staleChannel), etag: '"stale"' })
        .mockResolvedValueOnce({ body: JSON.stringify(freshChannel), etag: '"fresh"' });
      mockPutS3ObjectConditional
        .mockResolvedValueOnce({ ok: false, status: 412 })
        .mockResolvedValueOnce({ ok: true, etag: '"final"' });

      const storage = new S3ChannelStorage();
      const result = await storage.updateChannel("0xChannel1", (c) => ({
        ...c!,
        chargedCumulativeAmount: (BigInt(c!.chargedCumulativeAmount) + 1n).toString(),
      }));

      expect(result.status).toBe("updated");
      expect(result.channel?.chargedCumulativeAmount).toBe("201");
      expect(mockGetS3ObjectWithMeta).toHaveBeenCalledTimes(2);
      expect(mockPutS3ObjectConditional).toHaveBeenCalledTimes(2);
    });

    it("throws after exceeding the max CAS attempts", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue({
        body: JSON.stringify(makeChannel()),
        etag: '"e"',
      });
      mockPutS3ObjectConditional.mockResolvedValue({ ok: false, status: 412 });

      const storage = new S3ChannelStorage();
      await expect(
        storage.updateChannel("0xChannel1", (c) => ({ ...c!, chargedCumulativeAmount: "999" })),
      ).rejects.toThrow(/CAS attempts/);
    });

    it("deletes the object with If-Match when the callback returns undefined", async () => {
      const current = makeChannel();
      mockGetS3ObjectWithMeta.mockResolvedValue({
        body: JSON.stringify(current),
        etag: '"etag-1"',
      });
      mockDeleteS3Object.mockResolvedValue({ ok: true });

      const storage = new S3ChannelStorage();
      const result = await storage.updateChannel("0xChannel1", () => undefined);

      expect(result).toEqual({ channel: undefined, status: "deleted" });
      const [key, opts] = mockDeleteS3Object.mock.calls[0];
      expect(key).toBe("channels/0xchannel1.json");
      expect(opts.ifMatch).toBe('"etag-1"');
    });

    it("returns unchanged when deleting a channel that never existed", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(null);
      mockDeleteS3Object.mockResolvedValue({ ok: true });

      const storage = new S3ChannelStorage();
      const result = await storage.updateChannel("0xChannel1", () => undefined);

      expect(result).toEqual({ channel: undefined, status: "unchanged" });
    });

    it("retries the delete on a 412 conflict", async () => {
      const current = makeChannel();
      mockGetS3ObjectWithMeta.mockResolvedValue({
        body: JSON.stringify(current),
        etag: '"etag-1"',
      });
      mockDeleteS3Object
        .mockResolvedValueOnce({ ok: false, status: 412 })
        .mockResolvedValueOnce({ ok: true });

      const storage = new S3ChannelStorage();
      const result = await storage.updateChannel("0xChannel1", () => undefined);

      expect(result).toEqual({ channel: undefined, status: "deleted" });
      expect(mockDeleteS3Object).toHaveBeenCalledTimes(2);
    });
  });
});
