import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const OPTIMISM_ID = 10;
const OPTIMISM_SEPOLIA_ID = 11155420;
const BASE_ID = 8453;
const BASE_SEPOLIA_ID = 84532;

describe("getChain - chain selection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to mainnet when VITE_USE_TESTNET is not set", async () => {
    const { DEFAULT_SUPPORT_CHAIN, SUPPORT_V2_CHAINS } = await import("../utils/getChain");
    expect(DEFAULT_SUPPORT_CHAIN.id).toBe(OPTIMISM_ID);
    expect(SUPPORT_V2_CHAINS.map((c) => c.id)).toContain(OPTIMISM_ID);
    expect(SUPPORT_V2_CHAINS.map((c) => c.id)).toContain(BASE_ID);
  });

  it("uses testnet chains when VITE_USE_TESTNET=true", async () => {
    vi.stubEnv("VITE_USE_TESTNET", "true");
    const { DEFAULT_SUPPORT_CHAIN, SUPPORT_V2_CHAINS } = await import("../utils/getChain");
    expect(DEFAULT_SUPPORT_CHAIN.id).toBe(OPTIMISM_SEPOLIA_ID);
    expect(SUPPORT_V2_CHAINS.map((c) => c.id)).toContain(OPTIMISM_SEPOLIA_ID);
    expect(SUPPORT_V2_CHAINS.map((c) => c.id)).toContain(BASE_SEPOLIA_ID);
  });

  it("getSupportV2Config returns config for supported chain", async () => {
    const { getSupportV2Config } = await import("../utils/getChain");
    const config = getSupportV2Config(OPTIMISM_ID);
    expect(config).not.toBeNull();
    expect(config?.address).toMatch(/^0x/);
  });

  it("getSupportV2Config returns null for unsupported chain", async () => {
    const { getSupportV2Config } = await import("../utils/getChain");
    expect(getSupportV2Config(1)).toBeNull();
  });

  it("isSupportV2Chain identifies supported and unsupported chains", async () => {
    const { isSupportV2Chain } = await import("../utils/getChain");
    expect(isSupportV2Chain(OPTIMISM_ID)).toBe(true);
    expect(isSupportV2Chain(BASE_ID)).toBe(true);
    expect(isSupportV2Chain(1)).toBe(false);
  });
});
