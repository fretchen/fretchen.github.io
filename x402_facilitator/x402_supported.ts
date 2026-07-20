/**
 * x402 v2 Supported Capabilities Module
 * Creates fresh read-only facilitator instance (no singleton caching)
 */

import { formatUnits } from "viem";
import { createReadOnlyFacilitator } from "./facilitator_instance";
import { getFeeAmount, getFacilitatorAddress } from "./x402_fee";

/**
 * Facilitator fee disclosure, per x402 Fee Disclosure proposal (coinbase/x402#1016).
 *
 * Wire-format note: the base x402 `SupportedResponse.extensions` is `string[]` (a list
 * of extension KEY names). We advertise the key `"facilitatorFees"` in that array and
 * carry the machine-readable detail in this top-level sibling object — mirroring the
 * `/settle` response, whose `extensions` map also nests a `facilitatorFees` receipt.
 * This keeps `/supported` conformant with the SDK type while still disclosing the fee
 * model for fee-aware multi-facilitator routing.
 */
interface FacilitatorFeesDisclosure {
  version: string;
  model: string;
  asset: string;
  flatFee: string;
  decimals: number;
  /** Facilitator address that collects the fee (fee recipient / approval spender). */
  recipient: string;
  /** CAIP-2 networks this fee model applies to. */
  networks: string[];
  fee: {
    amount: string;
    description: string;
    collection: string;
  };
  setup: {
    description: string;
    function: string;
    spender: string;
    recommended_amount: string;
  };
}

/** Extension key advertised in `extensions` when a fee is configured. */
const FACILITATOR_FEE_EXTENSION_KEY = "facilitator_fee";
const FACILITATOR_FEES_EXTENSION_KEY = "facilitatorFees";

/**
 * Shape of our `/supported` response. Matches `x402Facilitator.getSupported()` (whose
 * `extensions` is `string[]`) plus our optional top-level `facilitatorFees` disclosure.
 * `network` is `string` here to match the class's return type; the base SDK
 * `SupportedResponse` narrows it to `Network`, but that distinction is irrelevant to
 * this response and forcing it would require casting the base return.
 */
interface SupportedCapabilities {
  kinds: Array<{
    x402Version: number;
    scheme: string;
    network: string;
    extra?: Record<string, unknown>;
  }>;
  extensions: string[];
  signers: Record<string, string[]>;
  /** Present only when a fee is configured (feeAmount > 0 and a facilitator key exists). */
  facilitatorFees?: FacilitatorFeesDisclosure;
}

/**
 * Get supported payment schemes and networks.
 * Creates a new read-only facilitator instance each time (no private key required).
 */
export function getSupportedCapabilities(): SupportedCapabilities {
  const facilitator = createReadOnlyFacilitator();

  // Base response: { kinds, extensions: string[], signers }
  const base = facilitator.getSupported();
  const supported: SupportedCapabilities = {
    ...base,
    extensions: [...(base.extensions ?? [])],
  };

  const feeAmount = getFeeAmount();
  const facilitatorAddress = getFacilitatorAddress();

  // Advertise the fee only when it is actually chargeable: a positive amount AND a
  // configured facilitator address to collect it. In read-only mode (no key) both the
  // extension keys and the disclosure object are omitted.
  if (feeAmount > 0n && facilitatorAddress) {
    supported.extensions.push(FACILITATOR_FEE_EXTENSION_KEY, FACILITATOR_FEES_EXTENSION_KEY);

    // Derive networks from `kinds` to stay consistent with the advertised response.
    supported.facilitatorFees = {
      version: "1",
      model: "flat",
      asset: "USDC",
      flatFee: feeAmount.toString(),
      decimals: 6,
      recipient: facilitatorAddress,
      networks: [...new Set(supported.kinds.map((k) => k.network))],
      fee: {
        amount: feeAmount.toString(),
        description: `${formatUnits(feeAmount, 6)} USDC per settlement`,
        collection: "post_settlement_transferFrom",
      },
      setup: {
        description:
          "One-time USDC approval required. Call approve() on the USDC contract for the facilitator's address.",
        function: "approve(address spender, uint256 amount)",
        spender: facilitatorAddress,
        recommended_amount: "100000000", // 100 USDC = 10,000 settlements
      },
    };
  }

  return supported;
}
