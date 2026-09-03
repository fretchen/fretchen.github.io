// @ts-check

/**
 * ⚠️ RETIRED — superseded by the merchant-pays model in `x402_fee.ts`.
 *
 * Buyer-pays splitter: the buyer signs one EIP-3009 authorization to EIP3009SplitterV1,
 * which atomically pays seller and facilitator. The seller needs no setup, but the buyer
 * needs a non-stock client and `payTo` shows the splitter rather than the real recipient.
 * See README → "Fee model history" for why the merchant-pays model won.
 *
 * Not deployed and not built: no function in `serverless.yml` routes here, and it is
 * excluded from the tsup `entry` list so it does not ship in the deploy archive.
 *
 * Retained, not dead: this is a working implementation of the alternative, and the
 * contract at 0x7e67bf96ADbf4a813DD7b0A3Ca3060a937018946 (Optimism Sepolia) is referenced
 * from x402-foundation/x402#937, so that deployment stays up. Its tests still run.
 */

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
    // x402 v2 spec: extensions array
    extensions:
      kinds.length > 0
        ? [
            {
              name: "facilitatorFees",
              version: "1",
              model: "flat",
              asset: "USDC",
              flatFee: FIXED_FEE,
              decimals: 6,
              collection: "on_chain_split",
              networks: kinds.map((k) => k.network),
            },
          ]
        : [],
    // x402 v2 spec: signers map (empty - payments are signed by payers, not facilitator)
    signers: {},
  };
}
