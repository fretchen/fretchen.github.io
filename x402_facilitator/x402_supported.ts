/**
 * x402 v2 Supported Capabilities Module
 * Creates fresh read-only facilitator instance (no singleton caching)
 */

import { formatUnits } from "viem";
import { createReadOnlyFacilitator } from "./facilitator_instance";
import { getFeeAmount, getFacilitatorAddress } from "./x402_fee";
import type { SupportedResponseBody } from "./x402_schemas";

/**
 * Shape of the `/supported` response. Derived from `SupportedResponseSchema`
 * (`x402_schemas.ts`) — that Zod schema is also what generates `openapi.json`'s
 * `SupportedResponse`, so this type and the published spec can't drift apart.
 */
type SupportedCapabilities = SupportedResponseBody;

/** Extension key advertised in `extensions` when a fee is configured. */
const FACILITATOR_FEE_EXTENSION_KEY = "facilitator_fee";
const FACILITATOR_FEES_EXTENSION_KEY = "facilitatorFees";

const DOCUMENTATION_URL = "https://www.fretchen.eu/x402/";
const SOURCE_URL = "https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator";
const OPENAPI_URL = "https://facilitator.fretchen.eu/openapi.json";

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
    links: { documentation: DOCUMENTATION_URL, source: SOURCE_URL, openapi: OPENAPI_URL },
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
        description:
          `${formatUnits(feeAmount, 6)} USDC per settlement (exact), or per claim/settle ` +
          "transaction (batch-settlement) — same flat amount either way. batch-settlement's " +
          "deposit/voucher/refund payloads are not charged; only claim/settle, which realize " +
          "a payment, are.",
        collection: "post_settlement_transferFrom",
      },
      setup: {
        description:
          "Recurring USDC approval. Call approve() on the USDC contract for the facilitator's address. " +
          "Applies to both schemes: exact recipients and batch-settlement claim/settle recipients draw " +
          "from the same allowance. The recommended amount is deliberately small: the spender is a hot " +
          "wallet, so a large standing allowance is a standing risk. Re-approve when remainingSettlements " +
          "(in the /verify response) runs low; revoke any time with approve(spender, 0).",
        function: "approve(address spender, uint256 amount)",
        spender: facilitatorAddress,
        // Deliberately small. The spender is the same key that signs every settlement
        // (FACILITATOR_WALLET_PRIVATE_KEY, a hot secret), so this figure is the per-merchant
        // blast radius of a key compromise — not a convenience setting. Raise it only with
        // that tradeoff in mind; the test in x402_supported.test.js bounds it.
        recommended_amount: "1000000", // 1 USDC = 100 settlements
      },
    };
  }

  return supported;
}
