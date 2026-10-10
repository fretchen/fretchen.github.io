import { describe, it, expect, vi } from "vitest";
import { getSettlementTokens, type SettlementTokenInfo } from "@fretchen/chain-utils";

// Importing the script pulls in x402_server, which reaches S3 only through these; stub them so
// importing the module for its pure helpers never touches the network (as migrate_channel_storage's test does).
vi.mock("@fretchen/s3-utils", () => ({
  getS3Object: vi.fn(),
  putS3Object: vi.fn(),
  listObjects: vi.fn(),
}));

import { assessAllowance, listFeePairs } from "../scripts/fee_allowances.js";

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
});
