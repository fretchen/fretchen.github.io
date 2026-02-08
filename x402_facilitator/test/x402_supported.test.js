// @ts-check

/**
 * Tests for x402 /supported endpoint
 *
 * Note: getSupportedCapabilities() creates a fresh read-only facilitator instance
 * each time, so no singleton caching or resetFacilitator() needed
 */
import { describe, test, expect, afterEach } from "vitest";
import { getSupportedCapabilities } from "../x402_supported.js";

describe("x402 /supported endpoint", () => {
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
    const capabilities = getSupportedCapabilities();

    expect(capabilities).toBeDefined();
    expect(capabilities.kinds).toBeDefined();
    expect(Array.isArray(capabilities.kinds)).toBe(true);
    expect(capabilities.extensions).toBeDefined();
    expect(Array.isArray(capabilities.extensions)).toBe(true);
  });

  test("includes Optimism Mainnet support", () => {
    const capabilities = getSupportedCapabilities();

    const mainnetSupport = capabilities.kinds.find((k) => k.network === "eip155:10");

    expect(mainnetSupport).toBeDefined();
    expect(mainnetSupport.x402Version).toBe(2);
    expect(mainnetSupport.scheme).toBe("exact");
    // x402 v2 getSupported() does NOT include assets in kinds
    // Assets would need to be added separately by the facilitator
  });

  test("includes Optimism Sepolia support", () => {
    const capabilities = getSupportedCapabilities();

    const sepoliaSupport = capabilities.kinds.find((k) => k.network === "eip155:11155420");

    expect(sepoliaSupport).toBeDefined();
    expect(sepoliaSupport.x402Version).toBe(2);
    expect(sepoliaSupport.scheme).toBe("exact");
    // x402 v2 getSupported() does NOT include assets in kinds
  });

  test("includes Base Mainnet support", () => {
    const capabilities = getSupportedCapabilities();

    const baseSupport = capabilities.kinds.find((k) => k.network === "eip155:8453");

    expect(baseSupport).toBeDefined();
    expect(baseSupport.x402Version).toBe(2);
    expect(baseSupport.scheme).toBe("exact");
  });

  test("includes Base Sepolia support", () => {
    const capabilities = getSupportedCapabilities();

    const baseSepoliaSupport = capabilities.kinds.find((k) => k.network === "eip155:84532");

    expect(baseSepoliaSupport).toBeDefined();
    expect(baseSepoliaSupport.x402Version).toBe(2);
    expect(baseSepoliaSupport.scheme).toBe("exact");
  });

  // Note: x402 v2 getSupported() does not include asset details (USDC, USDT, etc.)
  // Asset information is not provided in the kinds array by the facilitator
  // If needed, asset details would need to be added separately in the response

  test("does not include signer addresses (read-only mode)", () => {
    // getSupportedCapabilities uses read-only facilitator without private key
    // Even if FACILITATOR_WALLET_PRIVATE_KEY is set, supported endpoint doesn't use it
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const capabilities = getSupportedCapabilities();

    // signers contains the zero address in read-only mode (each scheme has a signer)
    expect(capabilities.signers).toBeDefined();
    expect(capabilities.signers["eip155:*"]).toBeDefined();
    expect(Array.isArray(capabilities.signers["eip155:*"])).toBe(true);
    // Read-only mode uses zero address as placeholder
    expect(capabilities.signers["eip155:*"]).toEqual([
      "0x0000000000000000000000000000000000000000",
    ]);
  });

  test("signers shows zero address when private key is not set (read-only mode)", () => {
    delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;

    const capabilities = getSupportedCapabilities();

    // Read-only facilitator uses zero address as signer placeholder
    expect(capabilities.signers).toBeDefined();
    expect(capabilities.signers["eip155:*"]).toEqual([
      "0x0000000000000000000000000000000000000000",
    ]);
  });

  test("signers shows zero address when private key is invalid (read-only mode)", () => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY = "invalid-key";

    const capabilities = getSupportedCapabilities();

    // Read-only facilitator uses zero address as signer placeholder
    expect(capabilities.signers).toBeDefined();
    expect(capabilities.signers["eip155:*"]).toEqual([
      "0x0000000000000000000000000000000000000000",
    ]);
  });

  test("includes facilitator_fee extension", () => {
    // Ensure a valid private key is set
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const capabilities = getSupportedCapabilities();

    expect(capabilities.extensions).toBeDefined();
    expect(capabilities.extensions.length).toBeGreaterThan(0);

    const feeExtension = capabilities.extensions.find((e) => e.name === "facilitator_fee");
    expect(feeExtension).toBeDefined();
    expect(feeExtension.description).toBeDefined();
    expect(feeExtension.fee.recipient).toBeDefined();
    expect(feeExtension.fee.recipient).not.toBeNull();
    expect(feeExtension.setup.spender).not.toBeNull();
  });

  test("includes facilitatorFees extension for fee-aware routing (#1016)", () => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const capabilities = getSupportedCapabilities();

    const feesExtension = capabilities.extensions.find((e) => e.name === "facilitatorFees");
    expect(feesExtension).toBeDefined();
    expect(feesExtension.version).toBe("1");
    expect(feesExtension.model).toBe("flat");
    expect(feesExtension.asset).toBe("USDC");
    expect(feesExtension.flatFee).toBe("10000");
    expect(feesExtension.decimals).toBe(6);
    expect(feesExtension.networks).toContain("eip155:10");
    expect(feesExtension.networks).toContain("eip155:8453");
    expect(feesExtension.networks).toContain("eip155:11155420");
    expect(feesExtension.networks).toContain("eip155:84532");
  });

  test("omits facilitator_fee extension when private key is missing", () => {
    delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;
    const capabilities = getSupportedCapabilities();

    const feeExtension = capabilities.extensions.find((e) => e.name === "facilitator_fee");
    expect(feeExtension).toBeUndefined();
  });
});
