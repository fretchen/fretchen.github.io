// @ts-check

/**
 * x402 v2 Supported Capabilities Module
 * Creates fresh read-only facilitator instance (no singleton caching)
 */

import { createReadOnlyFacilitator } from "./facilitator_instance.js";
import { getChainConfig } from "./chain_utils.js";

/**
 * Get supported payment schemes and networks
 * Creates a new read-only facilitator instance each time (no private key required)
 * @returns {Object} Supported capabilities
 */
export function getSupportedCapabilities() {
  // Create fresh read-only facilitator (no caching, no private key needed)
  const facilitator = createReadOnlyFacilitator();

  // Get base supported capabilities from facilitator
  const supported = facilitator.getSupported();

  // Add our custom extension information
  const mainnetConfig = getChainConfig("eip155:10");

  supported.extensions = [
    ...(supported.extensions || []),
    {
      name: "recipient_whitelist",
      description:
        "Payment recipients must be authorized through smart contract whitelist. Clients can verify authorization by calling isAuthorizedAgent(address) on the contracts below.",
      contracts: {
        "eip155:10": [
          {
            name: "GenImNFTv4",
            address: mainnetConfig.GENIMG_V4_ADDRESS,
            method: "isAuthorizedAgent(address)",
          },
          {
            name: "LLMv1",
            address: mainnetConfig.LLMV1_ADDRESS,
            method: "isAuthorizedAgent(address)",
          },
        ],
      },
    },
  ];

  return supported;
}
