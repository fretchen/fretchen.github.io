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

  test("reports the real facilitator address when a valid private key is configured", () => {
    // getSupportedCapabilities always uses the read-only facilitator (never signs
    // anything), but it must still report the *real* signer address here — newer SDK
    // clients (e.g. x402HTTPResourceServer.initialize()) reject a zero-address signer.
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const capabilities = getSupportedCapabilities();

    expect(capabilities.signers).toBeDefined();
    expect(capabilities.signers["eip155:*"]).toBeDefined();
    expect(Array.isArray(capabilities.signers["eip155:*"])).toBe(true);
    // Real address derived from the private key above (well-known Hardhat/Anvil account #0)
    expect(capabilities.signers["eip155:*"]).toEqual([
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
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

  test("advertises fee extension keys (spec-conformant string[] extensions)", () => {
    // Ensure a valid private key is set
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const capabilities = getSupportedCapabilities();

    // `extensions` is a list of extension KEY strings, per the x402 SupportedResponse type.
    expect(Array.isArray(capabilities.extensions)).toBe(true);
    expect(capabilities.extensions).toContain("facilitator_fee");
    expect(capabilities.extensions).toContain("facilitatorFees");
    // No objects leak into the array.
    capabilities.extensions.forEach((e) => expect(typeof e).toBe("string"));
  });

  test("discloses fee detail in the top-level facilitatorFees object (#1016)", () => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const capabilities = getSupportedCapabilities();

    const fees = capabilities.facilitatorFees;
    expect(fees).toBeDefined();
    expect(fees.version).toBe("1");
    expect(fees.model).toBe("flat");
    expect(fees.asset).toBe("USDC");
    expect(fees.flatFee).toBe("10000");
    expect(fees.decimals).toBe(6);
    // Facilitator address (fee recipient / approval spender) lives here now, not in `extensions`.
    expect(fees.recipient).toBeDefined();
    expect(fees.recipient).not.toBeNull();
    expect(fees.setup.spender).toBe(fees.recipient);
    expect(fees.fee.collection).toBe("post_settlement_transferFrom");
    expect(fees.networks).toContain("eip155:10");
    expect(fees.networks).toContain("eip155:8453");
    expect(fees.networks).toContain("eip155:11155420");
    expect(fees.networks).toContain("eip155:84532");
  });

  test("omits fee extension keys and disclosure when private key is missing", () => {
    delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;
    const capabilities = getSupportedCapabilities();

    expect(capabilities.extensions).not.toContain("facilitator_fee");
    expect(capabilities.extensions).not.toContain("facilitatorFees");
    expect(capabilities.facilitatorFees).toBeUndefined();
  });
});
