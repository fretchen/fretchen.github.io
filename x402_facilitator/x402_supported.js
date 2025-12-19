// @ts-check

/**
 * x402 v2 Supported Capabilities Module
 * Returns information about supported payment schemes and networks
 */

// Supported chains configuration
import { privateKeyToAccount } from "viem/accounts";
import { getFeeInformation } from "./fee_config.js";

/**
 * Get supported payment schemes and networks
 * @returns {Object} Supported capabilities
 */
export function getSupportedCapabilities() {
  // Get facilitator signer address from environment
  const privateKey = process.env.FACILITATOR_WALLET_PRIVATE_KEY;
  let signerAddress = null;

  if (privateKey) {
    try {
      const account = privateKeyToAccount(privateKey);
      signerAddress = account.address;
    } catch (_error) {
      // If private key is invalid, don't include signer
    }
  }

  // Get fee information for all supported tokens
  const feeInfo = getFeeInformation();

  const capabilities = {
    kinds: [
      {
        x402Version: 2,
        scheme: "exact",
        network: "eip155:10", // Optimism Mainnet
        assets: [
          {
            address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
            name: "USDC",
            symbol: "USDC",
            decimals: 6,
            fees: feeInfo["0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"],
          },
        ],
      },
      {
        x402Version: 2,
        scheme: "exact",
        network: "eip155:11155420", // Optimism Sepolia
        assets: [
          {
            address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
            name: "USDC",
            symbol: "USDC",
            decimals: 6,
            fees: feeInfo["0x5fd84259d66Cd46123540766Be93DFE6D43130D7"],
          },
        ],
      },
    ],
    extensions: [],
  };

  // Add signer information if available
  if (signerAddress) {
    capabilities.signers = {
      "eip155:*": [signerAddress],
    };
  }

  return capabilities;
}
