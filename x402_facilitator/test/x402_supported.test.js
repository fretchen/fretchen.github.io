// @ts-check

/**
 * Tests for x402 /supported endpoint
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
    expect(mainnetSupport.assets).toBeDefined();
    expect(mainnetSupport.assets.length).toBeGreaterThan(0);
  });

  test("includes Optimism Sepolia support", () => {
    const capabilities = getSupportedCapabilities();

    const sepoliaSupport = capabilities.kinds.find((k) => k.network === "eip155:11155420");

    expect(sepoliaSupport).toBeDefined();
    expect(sepoliaSupport.x402Version).toBe(2);
    expect(sepoliaSupport.scheme).toBe("exact");
    expect(sepoliaSupport.assets).toBeDefined();
    expect(sepoliaSupport.assets.length).toBeGreaterThan(0);
  });

  test("includes USDC on Optimism Mainnet", () => {
    const capabilities = getSupportedCapabilities();

    const mainnetSupport = capabilities.kinds.find((k) => k.network === "eip155:10");
    const usdcAsset = mainnetSupport.assets.find(
      (a) => a.address === "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    );

    expect(usdcAsset).toBeDefined();
    expect(usdcAsset.name).toBe("USDC");
    expect(usdcAsset.symbol).toBe("USDC");
    expect(usdcAsset.decimals).toBe(6);
  });

  // Note: USDT support is not implemented yet
  test.skip("includes USDT on Optimism Mainnet", () => {
    const capabilities = getSupportedCapabilities();

    const mainnetSupport = capabilities.kinds.find((k) => k.network === "eip155:10");
    const usdtAsset = mainnetSupport.assets.find(
      (a) => a.address === "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    );

    expect(usdtAsset).toBeDefined();
    expect(usdtAsset.name).toBe("Tether USD");
    expect(usdtAsset.symbol).toBe("USDT");
    expect(usdtAsset.decimals).toBe(6);
  });

  test("includes USDC on Optimism Sepolia", () => {
    const capabilities = getSupportedCapabilities();

    const sepoliaSupport = capabilities.kinds.find((k) => k.network === "eip155:11155420");
    const usdcAsset = sepoliaSupport.assets.find(
      (a) => a.address === "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    );

    expect(usdcAsset).toBeDefined();
    expect(usdcAsset.name).toBe("USDC");
    expect(usdcAsset.symbol).toBe("USDC");
    expect(usdcAsset.decimals).toBe(6);
  });

  test("includes signer information when private key is set", () => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const capabilities = getSupportedCapabilities();

    expect(capabilities.signers).toBeDefined();
    expect(capabilities.signers["eip155:*"]).toBeDefined();
    expect(Array.isArray(capabilities.signers["eip155:*"])).toBe(true);
    expect(capabilities.signers["eip155:*"].length).toBe(1);
    expect(capabilities.signers["eip155:*"][0]).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  });

  test("does not include signer information when private key is not set", () => {
    delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;

    const capabilities = getSupportedCapabilities();

    expect(capabilities.signers).toBeUndefined();
  });

  test("does not include signer information when private key is invalid", () => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY = "invalid-key";

    const capabilities = getSupportedCapabilities();

    expect(capabilities.signers).toBeUndefined();
  });
});
