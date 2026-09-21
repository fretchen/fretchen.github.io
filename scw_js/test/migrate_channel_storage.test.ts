import { describe, it, expect, vi } from "vitest";
import type { Channel } from "@x402/evm/batch-settlement/server";
import { computeChannelId } from "@x402/evm/batch-settlement/client";

// The script reaches S3 and the resource server at import time only through these; stub
// them so importing the module for its pure helpers never touches the network.
vi.mock("@fretchen/s3-utils", () => ({
  getS3Object: vi.fn(),
  putS3Object: vi.fn(),
  listObjects: vi.fn(),
}));

import { isLegacyKey, attribute } from "../scripts/migrate_channel_storage.js";

const OP = "eip155:10";
const BASE = "eip155:8453";
const NETWORKS = [OP, BASE, "eip155:84532"];

function makeConfig(salt = 1): Channel["channelConfig"] {
  return {
    payer: "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20",
    payerAuthorizer: "0x45E41fC1d1c7e47E209a2867F3948065B6b627A8",
    receiver: "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
    receiverAuthorizer: "0xF9B70303375f9762516669591D75049692Ab2c93",
    token: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    withdrawDelay: 86400,
    salt: `0x${salt.toString(16).padStart(64, "0")}`,
  } as Channel["channelConfig"];
}

function makeChannel(network: string, salt = 1): Channel {
  const channelConfig = makeConfig(salt);
  return {
    channelId: computeChannelId(channelConfig, network as `${string}:${string}`),
    channelConfig,
    chargedCumulativeAmount: "7062",
    signedMaxClaimable: "10000",
    signature: "0xsig",
    balance: "500000",
    totalClaimed: "0",
    withdrawRequestedAt: 0,
    refundNonce: 0,
    lastRequestTimestamp: Date.now(),
  };
}

describe("migrate_channel_storage", () => {
  describe("attribute", () => {
    it("attributes a legacy record to the network whose channelId matches", () => {
      expect(attribute(makeChannel(OP), NETWORKS)).toBe(OP);
      expect(attribute(makeChannel(BASE), NETWORKS)).toBe(BASE);
    });

    it("returns undefined for a record matching no network, so it is left in place", () => {
      // A channelConfig that predates a config change (e.g. withdrawDelay 900 -> 86400)
      // hashes to an id no current network reproduces. Guessing a home for it would file it
      // where its claim reverts; the migration must leave it alone and report it instead.
      const stale = makeChannel(OP);
      stale.channelConfig = { ...stale.channelConfig, withdrawDelay: 900 };
      expect(attribute(stale, NETWORKS)).toBeUndefined();
    });

    it("returns undefined rather than throwing on a malformed channelConfig", () => {
      const broken = { ...makeChannel(OP), channelConfig: {} as Channel["channelConfig"] };
      expect(attribute(broken, NETWORKS)).toBeUndefined();
    });
  });

  describe("isLegacyKey", () => {
    it("accepts a flat legacy key", () => {
      expect(isLegacyKey("channels/0xabc.json")).toBe(true);
    });

    it("rejects an already-migrated key, so a re-run does not nest it again", () => {
      expect(isLegacyKey("channels/eip155:10/0xabc.json")).toBe(false);
    });

    it("rejects keys outside the channels prefix", () => {
      expect(isLegacyKey("images/0xabc.json")).toBe(false);
    });
  });
});
