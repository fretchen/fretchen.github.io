/**
 * Tests for the batch-settlement test-wallet bypass (x402_whitelist.ts)
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isTestWalletBypassed } from "../x402_whitelist.js";

const MAINNET = "eip155:10"; // Optimism mainnet
const OP_SEPOLIA = "eip155:11155420";
const BASE_SEPOLIA = "eip155:84532";

describe("isTestWalletBypassed", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.BATCH_SETTLEMENT_TEST_WALLETS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("bypasses a test wallet on Optimism Sepolia", () => {
    const address = "0x1234567890123456789012345678901234567890";
    process.env.BATCH_SETTLEMENT_TEST_WALLETS = address;

    expect(isTestWalletBypassed(address, OP_SEPOLIA)).toBe(true);
  });

  it("bypasses a test wallet on Base Sepolia", () => {
    const address = "0x1234567890123456789012345678901234567890";
    process.env.BATCH_SETTLEMENT_TEST_WALLETS = address;

    expect(isTestWalletBypassed(address, BASE_SEPOLIA)).toBe(true);
  });

  it("does NOT bypass a test wallet on mainnet", () => {
    const address = "0x1234567890123456789012345678901234567890";
    process.env.BATCH_SETTLEMENT_TEST_WALLETS = address;

    expect(isTestWalletBypassed(address, MAINNET)).toBe(false);
  });

  it("is case-insensitive", () => {
    const address = "0xAaBbCcDdEeFf11223344556677889900AaBbCcDd";
    process.env.BATCH_SETTLEMENT_TEST_WALLETS = address.toLowerCase();

    expect(isTestWalletBypassed(address.toUpperCase(), BASE_SEPOLIA)).toBe(true);
  });

  it("handles multiple comma-separated addresses", () => {
    const wallet1 = "0x1111111111111111111111111111111111111111";
    const wallet2 = "0x2222222222222222222222222222222222222222";
    process.env.BATCH_SETTLEMENT_TEST_WALLETS = `${wallet1},${wallet2}`;

    expect(isTestWalletBypassed(wallet1, BASE_SEPOLIA)).toBe(true);
    expect(isTestWalletBypassed(wallet2, BASE_SEPOLIA)).toBe(true);
  });

  it("rejects everything when unset", () => {
    expect(isTestWalletBypassed("0x1111111111111111111111111111111111111111", MAINNET)).toBe(false);
    expect(isTestWalletBypassed("0x1111111111111111111111111111111111111111", BASE_SEPOLIA)).toBe(
      false,
    );
  });

  it("rejects an address not in the test-wallet list, even on testnet", () => {
    process.env.BATCH_SETTLEMENT_TEST_WALLETS = "0x1111111111111111111111111111111111111111";

    expect(isTestWalletBypassed("0x2222222222222222222222222222222222222222", BASE_SEPOLIA)).toBe(
      false,
    );
  });
});
