/**
 * x402 v2 Supported Capabilities Module
 * Creates fresh read-only facilitator instance (no singleton caching).
 * Advertises both EIP-3009 and Permit2 transfer methods (v2.3.1+).
 */

import { formatUnits } from "viem";
import { PERMIT2_ADDRESS, x402ExactPermit2ProxyAddress } from "@x402/evm";
import { createReadOnlyFacilitator } from "./facilitator_instance";
import { getFeeAmount, getFacilitatorAddress } from "./x402_fee";
import { getSupportedNetworks } from "./chain_utils";

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

interface Permit2Extension {
  name: string;
  description: string;
  permit2Address: string;
  proxyAddress: string;
  supportedMethods: string[];
}

interface SupportedCapabilities {
  kinds: Array<{
    x402Version: number;
    scheme: string;
    network: string;
    extra?: Record<string, unknown>;
  }>;
  extensions: Array<FeeExtension | FacilitatorFeesExtension | Permit2Extension | Record<string, unknown>>;
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

  // Filter to only our configured networks.
  // registerExactEvmScheme registers V1 schemes for ALL library-known chains,
  // so we must restrict the output to our actual supported networks.
  const allowedNetworks = new Set(getSupportedNetworks());
  supported.kinds = supported.kinds.filter((k) => allowedNetworks.has(k.network));

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

  // Advertise Permit2 support (v2.3.1+)
  const permit2Extension: Permit2Extension = {
    name: "permit2",
    description:
      "Permit2 support for universal ERC-20 token payments. Clients can use either EIP-3009 (transferWithAuthorization) or Permit2 (PermitWitnessTransferFrom) to authorize payments. Permit2 requires a one-time token approval to the canonical Permit2 contract.",
    permit2Address: PERMIT2_ADDRESS,
    proxyAddress: x402ExactPermit2ProxyAddress,
    supportedMethods: ["eip3009", "permit2"],
  };
  supported.extensions.push(permit2Extension);

  return supported;
}
