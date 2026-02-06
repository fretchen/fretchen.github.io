/**
 * x402 v2 Supported Capabilities Module
 * Creates fresh read-only facilitator instance (no singleton caching)
 */

import { createReadOnlyFacilitator } from "./facilitator_instance.js";
import { getChainConfig, getSupportedNetworks } from "./chain_utils.js";
import { getFeeAmount, getFacilitatorAddress } from "./x402_fee.js";

interface ContractInfo {
  name: string;
  address: string;
  method: string;
}

interface WhitelistExtension {
  name: string;
  description: string;
  contracts: Record<string, ContractInfo[]>;
}

interface FeeExtension {
  name: string;
  description: string;
  fee: {
    amount: string;
    asset: string;
    decimals: number;
    description: string;
    collection: string;
    recipient: string | null;
  };
  setup: {
    description: string;
    function: string;
    spender: string | null;
    recommended_amount: string;
  };
}

interface SupportedCapabilities {
  kinds: Array<{
    x402Version: number;
    scheme: string;
    network: string;
    extra?: Record<string, unknown>;
  }>;
  extensions: Array<WhitelistExtension | FeeExtension | Record<string, unknown>>;
  signers: Record<string, string[]>;
}

/**
 * Get supported payment schemes and networks.
 * Creates a new read-only facilitator instance each time (no private key required).
 */
export function getSupportedCapabilities(): SupportedCapabilities {
  const facilitator = createReadOnlyFacilitator();

  // Get base supported capabilities from facilitator
  const supported = facilitator.getSupported() as SupportedCapabilities;

  // Add our custom extension information for all networks with smart contracts
  const contracts: Record<string, ContractInfo[]> = {};

  for (const network of getSupportedNetworks()) {
    const config = getChainConfig(network);

    // Only add networks that have smart contracts deployed
    if (config.GENIMG_V4_ADDRESS || config.LLMV1_ADDRESS) {
      const networkContracts: ContractInfo[] = [];

      if (config.GENIMG_V4_ADDRESS) {
        networkContracts.push({
          name: "GenImNFTv4",
          address: config.GENIMG_V4_ADDRESS,
          method: "isAuthorizedAgent(address)",
        });
      }

      if (config.LLMV1_ADDRESS) {
        networkContracts.push({
          name: "LLMv1",
          address: config.LLMV1_ADDRESS,
          method: "isAuthorizedAgent(address)",
        });
      }

      if (networkContracts.length > 0) {
        contracts[network] = networkContracts;
      }
    }
  }

  supported.extensions = [
    ...(supported.extensions || []),
    {
      name: "recipient_whitelist",
      description:
        "Payment recipients must be authorized through smart contract whitelist. Clients can verify authorization by calling isAuthorizedAgent(address) on the contracts below.",
      contracts,
    },
  ];

  // Add fee extension for public access
  const feeAmount = getFeeAmount();
  const facilitatorAddress = getFacilitatorAddress();

  if (feeAmount > 0n) {
    const feeExtension: FeeExtension = {
      name: "facilitator_fee",
      description:
        "Public access with per-transaction fee. Non-whitelisted merchants must approve USDC spending for the facilitator address. Fee is collected post-settlement via ERC-20 transferFrom.",
      fee: {
        amount: feeAmount.toString(),
        asset: "USDC",
        decimals: 6,
        description: `${Number(feeAmount) / 1_000_000} USDC per settlement`,
        collection: "post_settlement_transferFrom",
        recipient: facilitatorAddress,
      },
      setup: {
        description:
          "One-time USDC approval required. Call approve() on the USDC contract for the facilitator's address.",
        function: "approve(address spender, uint256 amount)",
        spender: facilitatorAddress,
        recommended_amount: "100000000", // 100 USDC = 10,000 settlements
      },
    };
    supported.extensions.push(feeExtension);
  }

  return supported;
}
