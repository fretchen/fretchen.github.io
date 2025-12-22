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

  // x402 v2 getSupported() does not include asset details in kinds
  // Asset information would need to be fetched separately or hardcoded
  test.skip("includes USDC on Optimism Mainnet", () => {
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

  // x402 v2 getSupported() does not include asset details in kinds
  test.skip("includes USDC on Optimism Sepolia", () => {
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

  test("does not include signer addresses (read-only mode)", () => {
    // getSupportedCapabilities uses read-only facilitator without private key
    // Even if FACILITATOR_WALLET_PRIVATE_KEY is set, supported endpoint doesn't use it
    process.env.FACILITATOR_WALLET_PRIVATE_KEY =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const capabilities = getSupportedCapabilities();

    // signers exists but is empty array (read-only mode)
    expect(capabilities.signers).toBeDefined();
    expect(capabilities.signers["eip155:*"]).toBeDefined();
    expect(Array.isArray(capabilities.signers["eip155:*"])).toBe(true);
    expect(capabilities.signers["eip155:*"].length).toBe(0); // Empty in read-only mode
  });

  test("signers is empty array when private key is not set", () => {
    delete process.env.FACILITATOR_WALLET_PRIVATE_KEY;

    const capabilities = getSupportedCapabilities();

    // Read-only facilitator always has signers, but empty
    expect(capabilities.signers).toBeDefined();
    expect(capabilities.signers["eip155:*"]).toEqual([]);
  });

  test("signers is empty array when private key is invalid", () => {
    process.env.FACILITATOR_WALLET_PRIVATE_KEY = "invalid-key";

    const capabilities = getSupportedCapabilities();

    // Read-only facilitator doesn't validate private key, always has empty signers
    expect(capabilities.signers).toBeDefined();
    expect(capabilities.signers["eip155:*"]).toEqual([]);
  });

  test("includes recipient whitelist extension", () => {
    const capabilities = getSupportedCapabilities();

    expect(capabilities.extensions).toBeDefined();
    expect(capabilities.extensions.length).toBeGreaterThan(0);

    const whitelistExtension = capabilities.extensions.find(
      (e) => e.name === "recipient_whitelist",
    );
    expect(whitelistExtension).toBeDefined();
    expect(whitelistExtension.description).toBeDefined();
    expect(whitelistExtension.contracts).toBeDefined();
  });

  test("whitelist extension includes contracts for mainnet only", () => {
    const capabilities = getSupportedCapabilities();

    const whitelistExtension = capabilities.extensions.find(
      (e) => e.name === "recipient_whitelist",
    );

    // Mainnet contracts
    expect(whitelistExtension.contracts["eip155:10"]).toBeDefined();
    expect(Array.isArray(whitelistExtension.contracts["eip155:10"])).toBe(true);
    expect(whitelistExtension.contracts["eip155:10"].length).toBe(2);

    // Sepolia has no contracts deployed
    expect(whitelistExtension.contracts["eip155:11155420"]).toBeUndefined();
  });

  test("whitelist extension includes GenImNFTv4 and LLMv1 contracts on mainnet", () => {
    const capabilities = getSupportedCapabilities();

    const whitelistExtension = capabilities.extensions.find(
      (e) => e.name === "recipient_whitelist",
    );

    // Check Mainnet
    const mainnetContracts = whitelistExtension.contracts["eip155:10"];
    const genimgMainnet = mainnetContracts.find((c) => c.name === "GenImNFTv4");
    const llmMainnet = mainnetContracts.find((c) => c.name === "LLMv1");

    expect(genimgMainnet).toBeDefined();
    expect(genimgMainnet.address).toBe("0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb");
    expect(genimgMainnet.method).toBe("isAuthorizedAgent(address)");

    expect(llmMainnet).toBeDefined();
    expect(llmMainnet.address).toBe("0x833F39D6e67390324796f861990ce9B7cf9F5dE1");
    expect(llmMainnet.method).toBe("isAuthorizedAgent(address)");
  });
});
