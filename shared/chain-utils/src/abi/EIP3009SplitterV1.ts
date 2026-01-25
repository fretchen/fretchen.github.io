/**
 * EIP3009SplitterV1 Minimal ABI
 *
 * Contains only the functions used by x402_facilitator.
 * Full ABI available in: eth/abi/contracts/EIP3009SplitterV1.ts
 *
 * Used by:
 * - x402_facilitator/x402_splitter_settle.js: executeSplit
 * - x402_facilitator/x402_splitter_verify.js: isAuthorizationUsed, facilitatorWallet, fixedFee
 */

export const EIP3009SplitterV1ABI = [
  // ═══════════════════════════════════════════════════════════════
  // Read Functions
  // ═══════════════════════════════════════════════════════════════

  {
    name: "facilitatorWallet",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "fixedFee",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isAuthorizationUsed",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "authorizer", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },

  // ═══════════════════════════════════════════════════════════════
  // Write Functions
  // ═══════════════════════════════════════════════════════════════

  {
    name: "executeSplit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "buyer", type: "address" },
      { name: "seller", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "totalAmount", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // Events
  // ═══════════════════════════════════════════════════════════════

  {
    name: "SplitExecuted",
    type: "event",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "seller", type: "address", indexed: true },
      { name: "totalAmount", type: "uint256", indexed: false },
      { name: "sellerAmount", type: "uint256", indexed: false },
      { name: "facilitatorFee", type: "uint256", indexed: false },
    ],
  },
] as const;
