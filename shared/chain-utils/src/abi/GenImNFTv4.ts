/**
 * GenImNFTv4 Minimal ABI
 *
 * Contains only the functions used by scw_js and x402_facilitator.
 * Full ABI available in: eth/abi/contracts/GenImNFTv4.ts (after export)
 *
 * Used by:
 * - scw_js/genimg_bfl.js: ownerOf, requestImageUpdate, mintPrice, isImageUpdated
 * - scw_js/genimg_x402_token.js: safeMint, safeTransferFrom, mintPrice
 * - scw_js/readhandler_v2.js: ownerOf, requestImageUpdate, mintPrice, isImageUpdated
 * - x402_facilitator/x402_whitelist.js: isAuthorizedAgent
 */

export const GenImNFTv4ABI = [
  // ═══════════════════════════════════════════════════════════════
  // Read Functions
  // ═══════════════════════════════════════════════════════════════

  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "mintPrice",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isImageUpdated",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "isAuthorizedAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "isListed",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },

  // ═══════════════════════════════════════════════════════════════
  // Write Functions
  // ═══════════════════════════════════════════════════════════════

  {
    name: "safeMint",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "metadataUrl", type: "string" },
      { name: "_isListed", type: "bool" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "requestImageUpdate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "metadataUrl", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "safeTransferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // Events (for parsing transaction receipts)
  // ═══════════════════════════════════════════════════════════════

  {
    name: "Transfer",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
] as const;
