/**
 * x402 v2 Supported Capabilities Module
 * Creates fresh read-only facilitator instance (no singleton caching)
 */

import { formatUnits } from "viem";
import { createReadOnlyFacilitator } from "./facilitator_instance";
import { getFeeAmount, getFacilitatorAddress } from "./x402_fee";

/** Facilitator fee model disclosure per x402 Fee Disclosure proposal (coinbase/x402#1016) */
interface FacilitatorFeesExtension {
  name: string;
  version: string;
  model: string;
  asset: string;
  flatFee: string;
  decimals: number;
  networks: string[];
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
  extensions: Array<FeeExtension | FacilitatorFeesExtension | Record<string, unknown>>;
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

  // Ensure extensions array exists
  supported.extensions = supported.extensions || [];

  // Add fee extension for public access
  const feeAmount = getFeeAmount();
  const facilitatorAddress = getFacilitatorAddress();

  if (feeAmount > 0n && facilitatorAddress) {
    const feeExtension: FeeExtension = {
      name: "facilitator_fee",
      description:
        "Per-transaction fee for facilitator operation. Merchants must approve USDC spending for the facilitator address. Fee is collected post-settlement via ERC-20 transferFrom.",
      fee: {
        amount: feeAmount.toString(),
        asset: "USDC",
        decimals: 6,
        description: `${formatUnits(feeAmount, 6)} USDC per settlement`,
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

    // Add facilitatorFees extension per x402 Fee Disclosure proposal (#1016)
    // Static fee model disclosure for fee-aware multi-facilitator routing
    // Derive networks from supported.kinds to stay consistent with the response
    const facilitatorFeesExtension: FacilitatorFeesExtension = {
      name: "facilitatorFees",
      version: "1",
      model: "flat",
      asset: "USDC",
      flatFee: feeAmount.toString(),
      decimals: 6,
      networks: [...new Set(supported.kinds.map((k) => k.network))],
    };
    supported.extensions.push(facilitatorFeesExtension);
  }

  return supported;
}
