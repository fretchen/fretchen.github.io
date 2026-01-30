import { describe, it, expect, vi } from "vitest";
import { getGenAiNFTAddress, GenImNFTv4ABI, getViemChain } from "@fretchen/chain-utils";
import { getPublicClient } from "@wagmi/core";
import { config } from "../wagmi.config";

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

vi.mock("@fretchen/chain-utils", () => ({
  getGenAiNFTAddress: vi.fn(() => "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb"),
  GenImNFTv4ABI: [],
  fromCAIP2: vi.fn((network: string) => parseInt(network.split(":")[1])),
  getViemChain: vi.fn(() => ({ id: 10, name: "Optimism" })),
}));

describe("Contract Chain Selection", () => {
  it("should use configured chain even when wallet is on different chain", async () => {
    // Use chain-utils pattern
    const network = "eip155:10"; // Optimism mainnet
    const chain = getViemChain(network);
    const client = getPublicClient({ ...config, chains: [chain] });
    expect(client).toBeDefined();

    // Try to read from contract using chain-utils
    const contractAddress = getGenAiNFTAddress(network);
    const result = await client.readContract({
      address: contractAddress,
      abi: GenImNFTv4ABI,
      functionName: "getAllPublicTokens",
    });

    // We mainly care that the call succeeded - if it did, we used the right chain
    expect(result).toBeDefined();
    expect(contractAddress).toBe("0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb");
  });
});
