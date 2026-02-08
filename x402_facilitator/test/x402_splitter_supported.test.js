// @ts-check

/**
 * Tests for x402 Splitter Facilitator /supported endpoint
 *
 * Key differences from whitelist facilitator:
 * - Returns scheme "exact-split" instead of "exact"
 * - No whitelist extension (public facilitator)
 * - Includes splitter-specific fields in extra: facilitatorType, splitterAddress, fixedFee
 * - Returns facilitator wallet as signer
 */

import { describe, test, expect, afterEach } from "vitest";
import { getSplitterCapabilities } from "../x402_splitter_supported.js";

describe("x402 Splitter /supported endpoint", () => {
  const originalEnv = process.env.FACILITATOR_WALLET_PRIVATE_KEY;

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.FACILITATOR_WALLET_PRIVATE_KEY = originalEnv;
    } else {
      delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;
    }
  });

  test("returns supported capabilities", () => {
    const capabilities = getSplitterCapabilities();

    expect(capabilities).toBeDefined();
    expect(capabilities.kinds).toBeDefined();
    expect(Array.isArray(capabilities.kinds)).toBe(true);
    expect(capabilities.extensions).toBeDefined();
    expect(Array.isArray(capabilities.extensions)).toBe(true);
  });

  test("excludes Optimism Mainnet when splitter not deployed", () => {
    // Mainnet splitter is not yet deployed (SPLITTER_ADDRESS = null in chain_utils)
    const capabilities = getSplitterCapabilities();

    const mainnetSupport = capabilities.kinds.find((k) => k.network === "eip155:10");

    // Mainnet should NOT be included until splitter is deployed
    expect(mainnetSupport).toBeUndefined();
  });

  test("includes Optimism Sepolia support", () => {
    const capabilities = getSplitterCapabilities();

    const sepoliaSupport = capabilities.kinds.find((k) => k.network === "eip155:11155420");

    expect(sepoliaSupport).toBeDefined();
    expect(sepoliaSupport.x402Version).toBe(2);
    expect(sepoliaSupport.scheme).toBe("exact-split"); // Custom scheme
  });

  test("scheme is exact-split not exact", () => {
    const capabilities = getSplitterCapabilities();

    // Both networks should use exact-split
    capabilities.kinds.forEach((kind) => {
      expect(kind.scheme).toBe("exact-split");
      expect(kind.scheme).not.toBe("exact");
    });
  });

  test("includes facilitatorType in extra field", () => {
    const capabilities = getSplitterCapabilities();

    capabilities.kinds.forEach((kind) => {
      expect(kind.extra).toBeDefined();
      expect(kind.extra.facilitatorType).toBe("splitter");
    });
  });

  test("includes splitterAddress in extra field", () => {
    const capabilities = getSplitterCapabilities();

    const sepolia = capabilities.kinds.find((k) => k.network === "eip155:11155420");

    expect(sepolia.extra.splitterAddress).toBeDefined();
    expect(sepolia.extra.splitterAddress).toMatch(/^0x[a-fA-F0-9]{40}$/); // Valid address format
    expect(sepolia.extra.splitterAddress).toBe("0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946");
  });

  test("includes fixedFee in extra field", () => {
    const capabilities = getSplitterCapabilities();

    capabilities.kinds.forEach((kind) => {
      expect(kind.extra.fixedFee).toBeDefined();
      expect(kind.extra.fixedFee).toBe("10000"); // 0.01 USDC
    });
  });

  test("includes feeDescription in extra field", () => {
    const capabilities = getSplitterCapabilities();

    capabilities.kinds.forEach((kind) => {
      expect(kind.extra.feeDescription).toBeDefined();
      expect(kind.extra.feeDescription).toContain("0.01 USDC");
      expect(kind.extra.feeDescription).toContain("fixed fee");
    });
  });

  test("includes asset in extra field", () => {
    const capabilities = getSplitterCapabilities();

    capabilities.kinds.forEach((kind) => {
      expect(kind.extra.asset).toBeDefined();
      expect(kind.extra.asset).toMatch(/^eip155:\d+\/erc20:0x[a-fA-F0-9]{40}$/); // CAIP-19 format
    });
  });

  test("does NOT include whitelist parameter", () => {
    const capabilities = getSplitterCapabilities();

    capabilities.kinds.forEach((kind) => {
      expect(kind.extra.whitelist).toBeUndefined();
    });
  });

  test("extensions includes facilitatorFees for fee-aware routing (#1016)", () => {
    const capabilities = getSplitterCapabilities();

    expect(capabilities.extensions.length).toBeGreaterThan(0);
    const feesExtension = capabilities.extensions.find((e) => e.name === "facilitatorFees");
    expect(feesExtension).toBeDefined();
    expect(feesExtension.version).toBe("1");
    expect(feesExtension.model).toBe("flat");
    expect(feesExtension.asset).toBe("USDC");
    expect(feesExtension.flatFee).toBe("10000");
    expect(feesExtension.decimals).toBe(6);
    expect(feesExtension.collection).toBe("on_chain_split");
    expect(feesExtension.networks).toContain("eip155:11155420");
  });

  test("signers is empty (payments signed by payers, not facilitator)", () => {
    const capabilities = getSplitterCapabilities();

    expect(capabilities.signers).toBeDefined();
    // Splitter facilitator doesn't sign payments, payers do
    expect(capabilities.signers).toEqual({});
  });

  test("returns facilitatorFees extension (no recipient whitelist)", () => {
    const capabilities = getSplitterCapabilities();

    // Has facilitatorFees but no whitelist
    expect(capabilities.extensions.length).toBeGreaterThan(0);

    // Explicitly verify no whitelist extension exists
    const whitelistExtension = capabilities.extensions.find(
      (e) => e.name === "recipient_whitelist",
    );
    expect(whitelistExtension).toBeUndefined();
  });

  test("only includes networks with deployed splitter contracts", () => {
    const capabilities = getSplitterCapabilities();

    // Currently only Sepolia has a deployed splitter
    const sepolia = capabilities.kinds.find((k) => k.network === "eip155:11155420");
    expect(sepolia).toBeDefined();
    expect(sepolia.extra.splitterAddress).toBe("0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946");

    // Mainnet should not be included (splitter not deployed)
    const mainnet = capabilities.kinds.find((k) => k.network === "eip155:10");
    expect(mainnet).toBeUndefined();
  });

  test("Mainnet will use correct USDC asset when deployed", () => {
    // This test documents expected behavior once mainnet is deployed
    // Currently mainnet is excluded because splitter is not deployed
    const capabilities = getSplitterCapabilities();
    const mainnet = capabilities.kinds.find((k) => k.network === "eip155:10");

    // Mainnet not included yet
    expect(mainnet).toBeUndefined();

    // When deployed, it should use: eip155:10/erc20:0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85
  });

  test("Sepolia uses correct USDC asset", () => {
    const capabilities = getSplitterCapabilities();

    const sepolia = capabilities.kinds.find((k) => k.network === "eip155:11155420");

    // Optimism Sepolia USDC: 0x5fd84259d66Cd46123540766Be93DFE6D43130D7
    expect(sepolia.extra.asset).toBe(
      "eip155:11155420/erc20:0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    );
  });

  test("fixedFee matches contract configuration (10000 = 0.01 USDC)", () => {
    const capabilities = getSplitterCapabilities();

    capabilities.kinds.forEach((kind) => {
      const fixedFee = parseInt(kind.extra.fixedFee, 10);
      expect(fixedFee).toBe(10000); // 0.01 USDC with 6 decimals
    });
  });

  test("includes only networks with deployed splitter contracts", () => {
    const capabilities = getSplitterCapabilities();

    // Currently only Sepolia has deployed splitter
    expect(capabilities.kinds.length).toBe(1);

    // Verify only Sepolia is included
    const networks = capabilities.kinds.map((k) => k.network);
    expect(networks).not.toContain("eip155:10"); // Mainnet not deployed
    expect(networks).toContain("eip155:11155420"); // Sepolia deployed
  });

  test("all kinds have x402Version 2", () => {
    const capabilities = getSplitterCapabilities();

    capabilities.kinds.forEach((kind) => {
      expect(kind.x402Version).toBe(2);
    });
  });

  test("signers is empty object (no facilitator signing)", () => {
    const capabilities = getSplitterCapabilities();

    // Splitter doesn't require facilitator signatures
    expect(Object.keys(capabilities.signers).length).toBe(0);
  });

  test("response structure matches x402 v2 SupportedResponse schema", () => {
    const capabilities = getSplitterCapabilities();

    // Top-level structure
    expect(capabilities).toHaveProperty("kinds");
    expect(capabilities).toHaveProperty("extensions");
    expect(capabilities).toHaveProperty("signers");

    // kinds structure
    expect(Array.isArray(capabilities.kinds)).toBe(true);
    capabilities.kinds.forEach((kind) => {
      expect(kind).toHaveProperty("x402Version");
      expect(kind).toHaveProperty("scheme");
      expect(kind).toHaveProperty("network");
      expect(kind).toHaveProperty("extra");
    });

    // extensions structure
    expect(Array.isArray(capabilities.extensions)).toBe(true);

    // signers structure
    expect(typeof capabilities.signers).toBe("object");
  });
});
