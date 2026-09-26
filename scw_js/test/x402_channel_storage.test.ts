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

import { S3ChannelStorage, belongsToNetwork, channelPrefix } from "../x402_channel_storage.js";
import { computeChannelId } from "@x402/evm/batch-settlement/client";

// ===== Helpers =====

const OP = "eip155:10";
const BASE = "eip155:8453";

/**
 * A channelConfig differing only by `salt`, so two fixtures can share every field and still
 * be distinct channels. `withdrawDelay` matches the deployed 86400.
 */
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_EURC = "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42";

function makeConfig(
  salt = 1,
  token = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
): Channel["channelConfig"] {
  return {
    payer: "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20",
    payerAuthorizer: "0x45E41fC1d1c7e47E209a2867F3948065B6b627A8",
    receiver: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
    receiverAuthorizer: "0xF9B70303375f9762516669591D75049692Ab2c93",
    token,
    withdrawDelay: 86400,
    salt: `0x${salt.toString(16).padStart(64, "0")}`,
  } as Channel["channelConfig"];
}

/**
 * Builds a channel whose `channelId` is the REAL hash for `network`, so the storage's
 * network guard is exercised rather than stubbed. Pass a mismatched `network`/`idNetwork`
 * pair to simulate a misfiled object.
 */
function makeChannel(
  overrides: Partial<Channel> = {},
  { network = OP, salt = 1, token }: { network?: string; salt?: number; token?: string } = {},
): Channel {
  const channelConfig = makeConfig(salt, token);
  return {
    channelId: computeChannelId(channelConfig, network as `${string}:${string}`),
    channelConfig,
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
      const storage = new S3ChannelStorage(OP);
      const result = await storage.get("0xChannel1");
      expect(result).toBeUndefined();
    });

    it("returns the parsed channel and lowercases the key", async () => {
      const channel = makeChannel();
      mockGetS3ObjectWithMeta.mockResolvedValue({
        body: JSON.stringify(channel),
        etag: '"etag-1"',
      });
      const storage = new S3ChannelStorage(OP);
      const result = await storage.get("0xChannel1");
      expect(result).toEqual(channel);
      expect(mockGetS3ObjectWithMeta).toHaveBeenCalledWith("channels/eip155:10/0xchannel1.json");
    });
  });

  describe("list", () => {
    it("returns an empty array when there are no keys", async () => {
      mockListObjects.mockResolvedValue([]);
      const storage = new S3ChannelStorage(OP);
      const result = await storage.list();
      expect(result).toEqual([]);
    });

    it("fetches every key and returns channels sorted by channelId", async () => {
      const one = makeChannel({}, { network: OP, salt: 1 });
      const two = makeChannel({}, { network: OP, salt: 2 });
      const keyOf = (c: Channel) => `${channelPrefix(OP)}${c.channelId.toLowerCase()}.json`;
      mockListObjects.mockResolvedValue([keyOf(two), keyOf(one)]);
      mockGetS3ObjectWithMeta.mockImplementation(async (key: string) => {
        if (key === keyOf(one)) return { body: JSON.stringify(one), etag: '"e1"' };
        if (key === keyOf(two)) return { body: JSON.stringify(two), etag: '"e2"' };
        return null;
      });
      const storage = new S3ChannelStorage(OP);
      const result = await storage.list();
      expect(result.map((c) => c.channelId)).toEqual(
        [one.channelId, two.channelId].sort((a, b) => a.localeCompare(b)),
      );
    });

    it("lists only the network it was constructed for", async () => {
      // The regression that drained the escrow: one flat store handed Base channels to
      // Optimism claim batches, every batch reverted with claim_simulation_failed, and no
      // claim or refund ever landed. list() must never see another chain's channels.
      const opChannel = makeChannel({}, { network: OP, salt: 1 });
      mockListObjects.mockResolvedValue([
        `${channelPrefix(OP)}${opChannel.channelId.toLowerCase()}.json`,
      ]);
      mockGetS3ObjectWithMeta.mockResolvedValue({
        body: JSON.stringify(opChannel),
        etag: '"e1"',
      });

      const storage = new S3ChannelStorage(OP);
      await storage.list();

      expect(mockListObjects).toHaveBeenCalledWith("channels/eip155:10/");
      expect(mockListObjects).not.toHaveBeenCalledWith("channels/");
    });

    it("skips a record filed under the wrong network prefix", async () => {
      // Defence in depth for a bad migration: a Base channel sitting under the Optimism
      // prefix would revert the entire claim batch, taking every valid channel with it.
      const baseChannel = makeChannel({}, { network: BASE, salt: 1 });
      const opChannel = makeChannel({}, { network: OP, salt: 2 });
      const misfiled = `${channelPrefix(OP)}${baseChannel.channelId.toLowerCase()}.json`;
      const correct = `${channelPrefix(OP)}${opChannel.channelId.toLowerCase()}.json`;
      mockListObjects.mockResolvedValue([misfiled, correct]);
      mockGetS3ObjectWithMeta.mockImplementation(async (key: string) => {
        if (key === misfiled) return { body: JSON.stringify(baseChannel), etag: '"e1"' };
        if (key === correct) return { body: JSON.stringify(opChannel), etag: '"e2"' };
        return null;
      });

      const storage = new S3ChannelStorage(OP);
      const result = await storage.list();

      expect(result.map((c) => c.channelId)).toEqual([opChannel.channelId]);
    });

    describe("scoped to one token", () => {
      // USDC and EURC channels share Base's prefix. The claim cron lists one token at a time,
      // because the SDK claims every listed channel in its single token and the facilitator
      // refuses a batch that mixes tokens — one unfiltered list would fail every Base claim.
      const usdc = makeChannel({}, { network: BASE, salt: 1, token: BASE_USDC });
      const eurc = makeChannel({}, { network: BASE, salt: 2, token: BASE_EURC });
      const keyOf = (c: Channel) => `${channelPrefix(BASE)}${c.channelId.toLowerCase()}.json`;

      beforeEach(() => {
        mockListObjects.mockResolvedValue([keyOf(usdc), keyOf(eurc)]);
        mockGetS3ObjectWithMeta.mockImplementation(async (key: string) => {
          if (key === keyOf(usdc)) return { body: JSON.stringify(usdc), etag: '"e1"' };
          if (key === keyOf(eurc)) return { body: JSON.stringify(eurc), etag: '"e2"' };
          return null;
        });
      });

      it("lists only that token's channels", async () => {
        const eurcOnly = await new S3ChannelStorage(BASE, BASE_EURC).list();
        expect(eurcOnly.map((c) => c.channelId)).toEqual([eurc.channelId]);

        const usdcOnly = await new S3ChannelStorage(BASE, BASE_USDC).list();
        expect(usdcOnly.map((c) => c.channelId)).toEqual([usdc.channelId]);
      });

      it("matches the token case-insensitively", async () => {
        const result = await new S3ChannelStorage(BASE, BASE_EURC.toLowerCase()).list();
        expect(result.map((c) => c.channelId)).toEqual([eurc.channelId]);
      });

      it("lists both tokens when no token is given — the serving path's view", async () => {
        const result = await new S3ChannelStorage(BASE).list();
        expect(result).toHaveLength(2);
      });
    });
  });

  describe("belongsToNetwork", () => {
    it("matches a channel against the network its id was hashed for", () => {
      const channel = makeChannel({}, { network: OP });
      expect(belongsToNetwork(channel, OP)).toBe(true);
      expect(belongsToNetwork(channel, BASE)).toBe(false);
    });

    it("returns false for a malformed channelConfig rather than throwing", () => {
      const broken = { ...makeChannel(), channelConfig: {} as Channel["channelConfig"] };
      expect(belongsToNetwork(broken, OP)).toBe(false);
    });
  });

  describe("channelPrefix", () => {
    it("partitions channels by network", () => {
      expect(channelPrefix(OP)).toBe("channels/eip155:10/");
      expect(channelPrefix(BASE)).toBe("channels/eip155:8453/");
    });
  });

  describe("updateChannel", () => {
    it("creates a new channel with If-None-Match when none exists", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(null);
      mockPutS3ObjectConditional.mockResolvedValue({ ok: true, etag: '"new-etag"' });

      const storage = new S3ChannelStorage(OP);
      const newChannel = makeChannel();
      const result = await storage.updateChannel("0xChannel1", () => newChannel);

      expect(result).toEqual({ channel: newChannel, status: "updated" });
      const [key, , opts] = mockPutS3ObjectConditional.mock.calls[0];
      expect(key).toBe("channels/eip155:10/0xchannel1.json");
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

      const storage = new S3ChannelStorage(OP);
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

      const storage = new S3ChannelStorage(OP);
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

      const storage = new S3ChannelStorage(OP);
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

      const storage = new S3ChannelStorage(OP);
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

      const storage = new S3ChannelStorage(OP);
      const result = await storage.updateChannel("0xChannel1", () => undefined);

      expect(result).toEqual({ channel: undefined, status: "deleted" });
      const [key, opts] = mockDeleteS3Object.mock.calls[0];
      expect(key).toBe("channels/eip155:10/0xchannel1.json");
      expect(opts.ifMatch).toBe('"etag-1"');
    });

    it("returns unchanged when deleting a channel that never existed", async () => {
      mockGetS3ObjectWithMeta.mockResolvedValue(null);
      mockDeleteS3Object.mockResolvedValue({ ok: true });

      const storage = new S3ChannelStorage(OP);
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

      const storage = new S3ChannelStorage(OP);
      const result = await storage.updateChannel("0xChannel1", () => undefined);

      expect(result).toEqual({ channel: undefined, status: "deleted" });
      expect(mockDeleteS3Object).toHaveBeenCalledTimes(2);
    });
  });
});
