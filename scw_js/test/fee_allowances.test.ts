import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getSettlementTokens,
  EURE_ADDRESSES,
  EURC_ADDRESSES,
  USDC_ADDRESSES,
  type SettlementTokenInfo,
} from "@fretchen/chain-utils";

// Importing the script pulls in x402_server, which reaches S3 only through these; stub them so
// importing the module for its pure helpers never touches the network (as migrate_channel_storage's test does).
vi.mock("@fretchen/s3-utils", () => ({
  getS3Object: vi.fn(),
  putS3Object: vi.fn(),
  listObjects: vi.fn(),
}));

import { assessAllowance, listFeePairs } from "../scripts/fee_allowances.js";
import { facilitatorFeeFor } from "../fee_config.js";
import { getFacilitatorFeeConfig } from "../x402_server.js";

const FEE = 10_000n; // 0.01 of a 6-decimal token

describe("listFeePairs", () => {
  it("pairs every offered network with every token offered there", () => {
    const pairs = listFeePairs(["eip155:10", "eip155:8453"]).map(
      (p) => `${p.network} ${p.coin.symbol}`,
    );

    // Optimism has no EURC or EURe; Base has all three. The check must cover exactly what the
    // 402s offer — EURe included, or its approval is never checked and every EURe payment is
    // refused with insufficient_fee_allowance (the EURC launch bug).
    expect(pairs.sort()).toEqual([
      "eip155:10 USDC",
      "eip155:8453 EURC",
      "eip155:8453 EURe",
      "eip155:8453 USDC",
    ]);
  });

  it("follows the offer list rather than a list of its own", () => {
    const onlyUsdc = (network: string): SettlementTokenInfo[] =>
      getSettlementTokens(network).filter((coin) => coin.symbol === "USDC");

    expect(listFeePairs(["eip155:8453"], onlyUsdc).map((p) => p.coin.symbol)).toEqual(["USDC"]);
  });
});

describe("assessAllowance", () => {
  it("is short below one fee — the case that refused every EURC payment on Base", () => {
    expect(assessAllowance(0n, FEE)).toEqual({ kind: "short", settlementsLeft: 0n });
    expect(assessAllowance(FEE - 1n, FEE)).toEqual({ kind: "short", settlementsLeft: 0n });
  });

  it("is ok from exactly one fee, and counts the settlements left", () => {
    expect(assessAllowance(FEE, FEE)).toEqual({ kind: "ok", settlementsLeft: 1n });
    expect(assessAllowance(1_000_000n, FEE)).toEqual({ kind: "ok", settlementsLeft: 100n });
  });

  it("treats an unreadable allowance as unknown, never as short", () => {
    // Short would fail the predeploy gate on a flaky RPC, and --approve would write over an
    // allowance that may well exist.
    expect(assessAllowance(null, FEE)).toEqual({ kind: "unknown" });
  });

  it("counts EURe settlements with the 18-decimal fee, not the 6-decimal nominal one", () => {
    // The real wallet state that once printed "98000000000000 settlements left": a 0.98 EURe
    // allowance is 98 settlements at 0.01 EURe (10¹⁶) each — dividing by the nominal 10000
    // instead inflated it by 10¹².
    const EURE_FEE = 10_000_000_000_000_000n; // 0.01 EURe, 18 decimals
    expect(assessAllowance(980_000_000_000_000_000n, EURE_FEE)).toEqual({
      kind: "ok",
      settlementsLeft: 98n,
    });
  });
});

describe("facilitatorFeeFor — which fee figure applies to a token", () => {
  const BASE = "eip155:8453";
  const EURE_FEE = 10_000_000_000_000_000n; // 0.01 EURe, as /supported's assets publish it
  const config = (feeByAsset: Map<string, bigint>) => ({
    recipient: "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206" as `0x${string}`,
    flatFee: FEE,
    feeByAsset,
  });

  it("uses the per-token entry — EURe's fee is 10¹² the nominal figure", () => {
    const fee = config(new Map([[`${BASE}:${EURE_ADDRESSES[BASE].toLowerCase()}`, EURE_FEE]]));
    expect(facilitatorFeeFor(fee, BASE, EURE_ADDRESSES[BASE], 18)).toBe(EURE_FEE);
  });

  it("falls back to the nominal figure for a 6-decimal token with no per-token entry", () => {
    expect(facilitatorFeeFor(config(new Map()), BASE, USDC_ADDRESSES[BASE], 6)).toBe(FEE);
  });

  it("returns null for a non-6-decimal token without a per-token entry — never the nominal figure", () => {
    // The guard against the 10¹² bug: an old facilitator build publishes no assets, and the
    // only honest answer for EURe then is "unknown", not flatFee.
    expect(facilitatorFeeFor(config(new Map()), BASE, EURE_ADDRESSES[BASE], 18)).toBeNull();
  });

  it("matches the asset address case-insensitively and never across networks", () => {
    const fee = config(new Map([[`${BASE}:${EURE_ADDRESSES[BASE].toLowerCase()}`, EURE_FEE]]));
    expect(
      facilitatorFeeFor(fee, BASE, EURE_ADDRESSES[BASE].toUpperCase() as `0x${string}`, 18),
    ).toBe(EURE_FEE);
    // Base Sepolia's EURe has no entry here: the Base-mainnet fee must not answer for it.
    expect(facilitatorFeeFor(fee, "eip155:84532", EURE_ADDRESSES["eip155:84532"], 18)).toBeNull();
  });
});

describe("getFacilitatorFeeConfig — parsing /supported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** The shape the deployed facilitator publishes (facilitator.fretchen.eu/supported, abridged). */
  const supportedBody = (assets: unknown[]) => ({
    extensions: ["facilitator_fee", "facilitatorFees"],
    facilitatorFees: {
      version: "1",
      model: "flat",
      asset: "settled",
      flatFee: "10000",
      decimals: 6,
      recipient: "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206",
      assets,
    },
  });

  function stubSupported(body: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => body })),
    );
  }

  it("collects each token's own fee from facilitatorFees.assets, keyed network+asset", async () => {
    const BASE = "eip155:8453";
    stubSupported(
      supportedBody([
        {
          network: BASE,
          asset: USDC_ADDRESSES[BASE],
          symbol: "USDC",
          decimals: 6,
          flatFee: "10000",
          recommended_amount: "1000000",
        },
        {
          network: BASE,
          asset: EURC_ADDRESSES[BASE],
          symbol: "EURC",
          decimals: 6,
          flatFee: "10000",
          recommended_amount: "1000000",
        },
        {
          network: BASE,
          asset: EURE_ADDRESSES[BASE],
          symbol: "EURe",
          decimals: 18,
          flatFee: "10000000000000000",
          recommended_amount: "1000000000000000000",
        },
      ]),
    );

    const fee = await getFacilitatorFeeConfig();
    expect(fee?.recipient).toBe("0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206");
    expect(fee?.flatFee).toBe(FEE);
    expect(fee?.feeByAsset.get(`${BASE}:${EURE_ADDRESSES[BASE].toLowerCase()}`)).toBe(
      10_000_000_000_000_000n,
    );
  });

  it("skips malformed or zero-fee asset entries rather than guessing", async () => {
    const BASE = "eip155:8453";
    stubSupported(
      supportedBody([
        { network: BASE, asset: USDC_ADDRESSES[BASE], flatFee: "10000" }, // fine
        { network: BASE, flatFee: "10000" }, // no asset — skipped
        { network: BASE, asset: EURC_ADDRESSES[BASE], flatFee: "0" }, // zero fee — skipped
        { network: BASE, asset: "0xbadbadbadbadbadbadbadbadbadbadbadbadbad", flatFee: "nan" }, // unparseable — skipped
      ]),
    );

    const fee = await getFacilitatorFeeConfig();
    expect(fee?.feeByAsset.size).toBe(1);
    expect(fee?.feeByAsset.has(`${BASE}:${USDC_ADDRESSES[BASE].toLowerCase()}`)).toBe(true);
  });

  it("yields an empty per-token map on an old facilitator build, where only 6-decimal fees are knowable", async () => {
    stubSupported(supportedBody([]));

    const fee = await getFacilitatorFeeConfig();
    expect(fee?.feeByAsset.size).toBe(0);
    // The nominal fallback still answers for USDC/EURC; EURe is honestly unknown.
    expect(facilitatorFeeFor(fee!, "eip155:8453", USDC_ADDRESSES["eip155:8453"], 6)).toBe(FEE);
    expect(facilitatorFeeFor(fee!, "eip155:8453", EURE_ADDRESSES["eip155:8453"], 18)).toBeNull();
  });

  it("returns null when the facilitator advertises no fee at all", async () => {
    stubSupported({ extensions: [] });
    expect(await getFacilitatorFeeConfig()).toBeNull();
  });
});
