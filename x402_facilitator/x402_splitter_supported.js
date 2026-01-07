// @ts-check

/**
 * x402 Splitter Facilitator - Supported Capabilities
 * Returns x402 v2 compliant capability discovery response
 *
 * Uses custom "exact-split" scheme with fee splitting via smart contract
 * Only includes networks where the splitter contract is actually deployed.
 */

import { getChainConfig, getSupportedNetworks } from "./chain_utils.js";

const FIXED_FEE = process.env.FIXED_FEE || "10000"; // 0.01 USDC

/**
 * Get supported capabilities for splitter facilitator
 * Only returns networks where SPLITTER_ADDRESS is configured (not null)
 * @returns {Object} x402 v2 SupportedResponse
 */
export function getSplitterCapabilities() {
  const kinds = [];

  for (const network of getSupportedNetworks()) {
    const config = getChainConfig(network);

    // Only include networks with deployed splitter contract
    if (config.SPLITTER_ADDRESS) {
      kinds.push({
        x402Version: 2,
        scheme: "exact-split",
        network,
        extra: {
          facilitatorType: "splitter",
          splitterAddress: config.SPLITTER_ADDRESS,
          fixedFee: FIXED_FEE,
          feeCurrency: "USDC",
          feeDescription:
            network === "eip155:10"
              ? "0.01 USDC fixed fee per transaction"
              : "0.01 USDC fixed fee per transaction (testnet)",
          asset: `${network}/erc20:${config.USDC_ADDRESS}`,
        },
      });
    }
  }

  return {
    // x402 v2 spec: /supported endpoint returns "kinds" array
    kinds,
    // x402 v2 spec: extensions array (empty for now - no whitelist)
    extensions: [],
    // x402 v2 spec: signers map (empty - payments are signed by payers, not facilitator)
    signers: {},
  };
}
