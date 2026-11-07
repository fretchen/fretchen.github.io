/**
 * x402 v2 Supported Capabilities Module
 * Creates fresh read-only facilitator instance (no singleton caching)
 */

import { createReadOnlyFacilitator } from "./facilitator_instance";
import { formatUnits, parseUnits } from "viem";
import { getFeeTokens } from "./chain_utils";
import { feeAmountFor, getFeeAmount, getFacilitatorAddress } from "./x402_fee";
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
/**
 * The @x402/evm extension carrying an EIP-2612 permit to Permit2 inside the payment, so an EURe
 * buyer needs no separate approve() transaction. The exact scheme verifies and settles it from the
 * payload alone (settleWithPermit); a resource server reads this key from `/supported` to decide
 * whether to offer it in its 402.
 */
const EIP2612_GAS_SPONSORING_EXTENSION_KEY = "eip2612GasSponsoring";

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
    extensions: [...(base.extensions ?? []), EIP2612_GAS_SPONSORING_EXTENSION_KEY],
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
    const networks = [...new Set(supported.kinds.map((k) => k.network))];
    supported.facilitatorFees = {
      version: "1",
      model: "flat",
      // Not a token: the fee is charged in whichever token the payment settles in.
      asset: "settled",
      flatFee: feeAmount.toString(),
      decimals: 6,
      recipient: facilitatorAddress,
      networks,
      fee: {
        amount: feeAmount.toString(),
        description:
          `${formatUnits(feeAmount, 6)} of the settled token (USDC; EURC and EURe on Base) per ` +
          "settlement (exact), or per on-chain claim " +
          "or settle transaction (batch-settlement) — same flat amount either way. " +
          "batch-settlement charges whatever realizes a payment: claim, settle, and a refund " +
          "that carries claims (which settles them in the same transaction). Deposits, " +
          "vouchers, and claim-less refunds are not charged.",
        collection: "post_settlement_transferFrom",
      },
      setup: {
        description:
          "Recurring approval, one per token you are paid in: call approve() on the USDC contract " +
          "(any network) and/or the EURC and EURe contracts (Base) for the facilitator's address. " +
          "EURe has 18 decimals: approve the per-token amount listed in `assets`. A settlement " +
          "in a token you have not approved is refused. Applies to both schemes: exact recipients and " +
          "batch-settlement claim/settle recipients draw from the same per-token allowance. The recommended amount is deliberately small: the spender is a hot " +
          "wallet, so a large standing allowance is a standing risk. Re-approve when remainingSettlements " +
          "(in the /verify response) runs low; revoke any time with approve(spender, 0).",
        function: "approve(address spender, uint256 amount)",
        spender: facilitatorAddress,
        // Deliberately small. The spender is the same key that signs every settlement
        // (FACILITATOR_WALLET_PRIVATE_KEY, a hot secret), so this figure is the per-merchant
        // blast radius of a key compromise — not a convenience setting. Raise it only with
        // that tradeoff in mind; the test in x402_supported.test.js bounds it.
        recommended_amount: "1000000", // 1 token (6 decimals) = 100 settlements
      },
      // The same 0.01 fee and 1-token approval, in each token's own units.
      assets: networks.flatMap((network) =>
        getFeeTokens(network).map((token) => ({
          network,
          asset: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          flatFee: feeAmountFor(token.decimals).toString(),
          recommended_amount: parseUnits("1", token.decimals).toString(),
        })),
      ),
    };
  }

  return supported;
}
