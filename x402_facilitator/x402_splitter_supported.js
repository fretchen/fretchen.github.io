// @ts-check

/**
 * x402 Splitter Facilitator - Supported Capabilities
 * Returns x402 v2 compliant capability discovery response
 *
 * Uses standard "exact" scheme (EIP-3009) with fee info in extra field
 */

import { SPLITTER_ADDRESSES } from "./eip3009_splitter_abi.js";

const FIXED_FEE = process.env.FIXED_FEE || "10000"; // 0.01 USDC
const FACILITATOR_WALLET = process.env.FACILITATOR_WALLET_ADDRESS || "";

/**
 * Get supported capabilities for splitter facilitator
 * @returns {Object} x402 v2 SupportedResponse
 */
export function getSplitterCapabilities() {
  return {
    // x402 v2 spec: /supported endpoint returns "kinds" array
    kinds: [
      {
        x402Version: 2,
        scheme: "exact-split", // ✅ Custom scheme for splitter facilitator
        network: "eip155:10", // Optimism Mainnet
        extra: {
          // ✅ Facilitator-specific configuration goes in extra
          facilitatorType: "splitter",
          splitterAddress: SPLITTER_ADDRESSES["eip155:10"],
          fixedFee: FIXED_FEE,
          feeCurrency: "USDC",
          feeDescription: "0.01 USDC fixed fee per transaction",
          asset: "eip155:10/erc20:0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // USDC mainnet
        },
      },
      {
        x402Version: 2,
        scheme: "exact-split",
        network: "eip155:11155420", // Optimism Sepolia
        extra: {
          facilitatorType: "splitter",
          splitterAddress: SPLITTER_ADDRESSES["eip155:11155420"],
          fixedFee: FIXED_FEE,
          feeCurrency: "USDC",
          feeDescription: "0.01 USDC fixed fee per transaction (testnet)",
          asset: "eip155:11155420/erc20:0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // USDC Sepolia
        },
      },
    ],
    // x402 v2 spec: extensions array (empty for now)
    extensions: [],
    // x402 v2 spec: signers map (CAIP-2 pattern -> addresses)
    signers: {
      "eip155:*": FACILITATOR_WALLET ? [FACILITATOR_WALLET] : [],
    },
  };
}
