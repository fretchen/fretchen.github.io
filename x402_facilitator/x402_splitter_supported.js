// @ts-check

/**
 * x402 Splitter Facilitator - Supported Capabilities
 * Returns x402 v2 compliant capability discovery response
 *
 * Uses custom "exact-split" scheme with fee splitting via smart contract
 */

import { SPLITTER_ADDRESSES } from "./eip3009_splitter_abi.js";

const FIXED_FEE = process.env.FIXED_FEE || "10000"; // 0.01 USDC

/**
 * Get supported capabilities for splitter facilitator
 * @returns {Object} x402 v2 SupportedResponse
 */
export function getSplitterCapabilities() {
  const mainnetSplitter =
    SPLITTER_ADDRESSES["eip155:10"] || "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946";
  const sepoliaSplitter =
    SPLITTER_ADDRESSES["eip155:11155420"] || "0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946";

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
          splitterAddress: mainnetSplitter,
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
          splitterAddress: sepoliaSplitter,
          fixedFee: FIXED_FEE,
          feeCurrency: "USDC",
          feeDescription: "0.01 USDC fixed fee per transaction (testnet)",
          asset: "eip155:11155420/erc20:0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // USDC Sepolia
        },
      },
    ],
    // x402 v2 spec: extensions array (empty for now - no whitelist)
    extensions: [],
    // x402 v2 spec: signers map (empty - payments are signed by payers, not facilitator)
    signers: {},
  };
}
