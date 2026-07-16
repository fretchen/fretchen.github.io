/**
 * Tests for the batch-settlement recipient whitelist (x402_whitelist.ts)
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isRecipientWhitelisted } from "../x402_whitelist.js";

const MAINNET = "eip155:10"; // Optimism mainnet
const OP_SEPOLIA = "eip155:11155420";
const BASE_SEPOLIA = "eip155:84532";

describe("isRecipientWhitelisted", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.BATCH_SETTLEMENT_MANUAL_WHITELIST;
    delete process.env.BATCH_SETTLEMENT_TEST_WALLETS;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("manual whitelist", () => {
    it("whitelists a manually-added address on mainnet", () => {
      const address = "0x1234567890123456789012345678901234567890";
      process.env.BATCH_SETTLEMENT_MANUAL_WHITELIST = address;

      expect(isRecipientWhitelisted(address, MAINNET)).toBe(true);
    });

    it("whitelists a manually-added address on testnet too", () => {
      const address = "0x1234567890123456789012345678901234567890";
      process.env.BATCH_SETTLEMENT_MANUAL_WHITELIST = address;

      expect(isRecipientWhitelisted(address, BASE_SEPOLIA)).toBe(true);
    });

    it("handles multiple comma-separated addresses", () => {
      const wallet1 = "0x1111111111111111111111111111111111111111";
      const wallet2 = "0x2222222222222222222222222222222222222222";
      process.env.BATCH_SETTLEMENT_MANUAL_WHITELIST = `${wallet1},${wallet2}`;

      expect(isRecipientWhitelisted(wallet1, MAINNET)).toBe(true);
      expect(isRecipientWhitelisted(wallet2, MAINNET)).toBe(true);
    });

    it("is case-insensitive", () => {
      const address = "0xAaBbCcDdEeFf11223344556677889900AaBbCcDd";
      process.env.BATCH_SETTLEMENT_MANUAL_WHITELIST = address.toLowerCase();

      expect(isRecipientWhitelisted(address.toUpperCase(), MAINNET)).toBe(true);
    });

    it("rejects an address not in the manual whitelist", () => {
      process.env.BATCH_SETTLEMENT_MANUAL_WHITELIST = "0x1111111111111111111111111111111111111111";

      expect(isRecipientWhitelisted("0x2222222222222222222222222222222222222222", MAINNET)).toBe(
        false,
      );
    });
  });

  describe("test wallets", () => {
    it("whitelists a test wallet on Optimism Sepolia", () => {
      const address = "0x1234567890123456789012345678901234567890";
      process.env.BATCH_SETTLEMENT_TEST_WALLETS = address;

      expect(isRecipientWhitelisted(address, OP_SEPOLIA)).toBe(true);
    });

    it("whitelists a test wallet on Base Sepolia", () => {
      const address = "0x1234567890123456789012345678901234567890";
      process.env.BATCH_SETTLEMENT_TEST_WALLETS = address;

      expect(isRecipientWhitelisted(address, BASE_SEPOLIA)).toBe(true);
    });

    it("does NOT whitelist a test wallet on mainnet", () => {
      const address = "0x1234567890123456789012345678901234567890";
      process.env.BATCH_SETTLEMENT_TEST_WALLETS = address;

      expect(isRecipientWhitelisted(address, MAINNET)).toBe(false);
    });

    it("is case-insensitive", () => {
      const address = "0xAaBbCcDdEeFf11223344556677889900AaBbCcDd";
      process.env.BATCH_SETTLEMENT_TEST_WALLETS = address.toLowerCase();

      expect(isRecipientWhitelisted(address.toUpperCase(), BASE_SEPOLIA)).toBe(true);
    });
  });

  describe("no whitelist configured", () => {
    it("rejects everything when both env vars are unset", () => {
      expect(isRecipientWhitelisted("0x1111111111111111111111111111111111111111", MAINNET)).toBe(
        false,
      );
      expect(
        isRecipientWhitelisted("0x1111111111111111111111111111111111111111", BASE_SEPOLIA),
      ).toBe(false);
    });
  });

  describe("OR logic", () => {
    it("whitelists via manual list even when not a test wallet", () => {
      const manual = "0x1111111111111111111111111111111111111111";
      const testWallet = "0x2222222222222222222222222222222222222222";
      process.env.BATCH_SETTLEMENT_MANUAL_WHITELIST = manual;
      process.env.BATCH_SETTLEMENT_TEST_WALLETS = testWallet;

      expect(isRecipientWhitelisted(manual, BASE_SEPOLIA)).toBe(true);
    });

    it("whitelists via test wallets even when not manually listed (testnet only)", () => {
      const manual = "0x1111111111111111111111111111111111111111";
      const testWallet = "0x2222222222222222222222222222222222222222";
      process.env.BATCH_SETTLEMENT_MANUAL_WHITELIST = manual;
      process.env.BATCH_SETTLEMENT_TEST_WALLETS = testWallet;

      expect(isRecipientWhitelisted(testWallet, BASE_SEPOLIA)).toBe(true);
      expect(isRecipientWhitelisted(testWallet, MAINNET)).toBe(false);
    });
  });
});
