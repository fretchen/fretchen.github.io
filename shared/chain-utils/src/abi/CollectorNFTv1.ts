/**
 * Minimal ABI for CollectorNFTv1 contract
 *
 * Only includes functions used by website components:
 * - getMintStats: Get mint count and pricing info for a GenImNFT token
 * - mintCollectorNFT: Mint a collector edition of a GenImNFT
 */

export const CollectorNFTv1ABI = [
  {
    name: "getMintStats",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "genImTokenId", type: "uint256" }],
    outputs: [
      { name: "mintCount", type: "uint256" },
      { name: "currentPrice", type: "uint256" },
      { name: "nextPrice", type: "uint256" },
    ],
  },
  {
    name: "mintCollectorNFT",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "genImTokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
