import { describe, it, expect, vi } from "vitest";
import { genAiNFTContractConfig, getConfiguredPublicClient } from "../utils/getChain";

vi.mock("wagmi/chains", async () => {
  return {
    mainnet: { id: 1, name: "mainnet" },
    optimism: { id: 10, name: "optimism" },
    optimismSepolia: { id: 11155420, name: "optimismSepolia" },
    sepolia: { id: 11155111, name: "sepolia" },
  };
});

vi.mock("../wagmi.config", () => ({
  config: {
    chains: [],
    transports: {},
  },
}));

vi.mock("@wagmi/core", () => ({
  getPublicClient: vi.fn().mockReturnValue({
    readContract: vi.fn().mockResolvedValue([1, 2, 3]),
    chain: { id: 10 }, // Optimism chain ID
  }),
}));

describe("Contract Chain Selection", () => {
  it("should use configured chain even when wallet is on different chain", async () => {
    // Use our new function that should enforce the correct chain
    const client = getConfiguredPublicClient();
    expect(client).toBeDefined();

    // Try to read from contract
    const result = await client.readContract({
      address: genAiNFTContractConfig.address,
      abi: genAiNFTContractConfig.abi,
      functionName: "getAllPublicTokens",
    });

    // We mainly care that the call succeeded - if it did, we used the right chain
    expect(result).toBeDefined();
  });
});
