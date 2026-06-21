/**
 * LLMv1 Minimal ABI
 *
 * Contains only the functions used by scw_js for LLM service.
 * Note: LLMv1 is legacy and out of scope for multi-chain migration.
 *
 * Used by:
 * - scw_js/llm_service.js: checkBalance, processBatch
 */

export const LLMv1ABI = [
  // ═══════════════════════════════════════════════════════════════
  // Read Functions
  // ═══════════════════════════════════════════════════════════════

  {
    name: "checkBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ═══════════════════════════════════════════════════════════════
  // Write Functions
  // ═══════════════════════════════════════════════════════════════

  {
    name: "processBatch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "merkleRoot", type: "bytes32" },
      {
        name: "leaves",
        type: "tuple[]",
        components: [
          { name: "id", type: "int256" },
          { name: "user", type: "address" },
          { name: "serviceProvider", type: "address" },
          { name: "tokenCount", type: "uint256" },
          { name: "cost", type: "uint256" },
          { name: "timestamp", type: "string" },
        ],
      },
      { name: "proofs", type: "bytes32[][]" },
    ],
    outputs: [],
  },
] as const;
