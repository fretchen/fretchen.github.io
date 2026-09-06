/**
 * Zod schemas for the facilitator's wire contracts.
 *
 * These are the single source for both the response types used internally and the
 * generated `openapi.json` (see `scripts/generate-openapi.ts`) — a shape change here
 * is a type error everywhere it's inconsistent, and a `npm run generate:openapi` away
 * from being documented. Before this file existed, the OpenAPI spec was a hand-written
 * second description of the same shapes with nothing keeping the two in sync; that's
 * exactly how `/supported`'s `facilitatorFees` ended up documented as a bare
 * `{"type": "object"}` while the real disclosure grew a dozen fields across two
 * fee-model phases.
 *
 * Scope is deliberately response-only. The request body (`PaymentRequestSchema`) stays
 * shallow, matching what the facilitator has always done: `exact` and
 * `batch-settlement` payloads have genuinely different shapes that `@x402/evm`
 * validates internally, and re-modeling that here would just be re-implementing the
 * SDK's own validation.
 *
 * `/verify` and `/settle` hand-assemble their response bodies in `x402_facilitator.ts`
 * rather than serializing an internal result object directly (deliberately — internal
 * types like `SettleResult` carry fields, e.g. `errorMessage`, that must never reach
 * the wire). `VerifyResponseSchema`/`SettleResponseSchema` model exactly what gets
 * assembled there; `x402_facilitator.ts` annotates those object literals with the
 * matching `z.infer<>` type so the compiler catches the two ever falling out of sync.
 * `/supported`, by contrast, serializes its result object unfiltered
 * (`JSON.stringify(capabilities)`), so `SupportedResponseSchema` models
 * `getSupportedCapabilities()`'s full return shape directly.
 */

import { z } from "zod";

// ── Request (shared by /verify and /settle) ──

const AcceptedSchema = z.object({
  network: z.string().optional().describe("CAIP-2 network id, e.g. eip155:10."),
  scheme: z.string().optional().describe("e.g. exact, batch-settlement."),
});

export const PaymentRequestSchema = z
  .object({
    paymentPayload: z
      .object({ accepted: AcceptedSchema })
      .describe(
        "The x402 v2 PaymentPayload the buyer produced — includes accepted.network, " +
          "accepted.scheme, and the signed authorization. Passed through as received; " +
          "the facilitator does not re-derive it.",
      ),
    paymentRequirements: z
      .object({
        amount: z.string().optional().describe("Atomic units of the payment asset."),
      })
      .describe("The x402 v2 PaymentRequirements the seller advertised in its 402 response."),
  })
  .describe("Identical shape for /verify and /settle.");

// ── /verify ──

export const VerifyResponseSchema = z.object({
  isValid: z.boolean(),
  payer: z.string().optional().describe("The buyer's address, when known."),
  invalidReason: z.string().optional().describe("Present when isValid is false."),
  remainingSettlements: z
    .number()
    .int()
    .optional()
    .describe(
      "How many more settlements the seller's current USDC approval for this facilitator " +
        "still covers. Present only when a fee is configured and the allowance could be " +
        "read — an early warning before it hits zero.",
    ),
});

export type VerifyResponseBody = z.infer<typeof VerifyResponseSchema>;

// ── /settle ──

export const FeeStatusSchema = z.enum(["collected", "pending", "failed"]);

/** Facilitator fee receipt per x402 Fee Disclosure proposal (coinbase/x402#1016). */
export const FacilitatorFeePaidSchema = z.object({
  version: z.string(),
  facilitatorFeePaid: z
    .string()
    .describe("Fee ASSESSED for this payment. Never varies with the collection outcome."),
  asset: z.string(),
  model: z.string(),
  collection: z.object({
    status: FeeStatusSchema,
    txHash: z.string().optional(),
  }),
});

export const SettleResponseSchema = z.object({
  success: z.boolean(),
  payer: z.string().optional(),
  transaction: z
    .string()
    .optional()
    .describe("On-chain settlement tx hash. Empty string on failure."),
  network: z.string().optional().describe("CAIP-2 network id the settlement ran on."),
  errorReason: z.string().optional().describe("Present when success is false."),
  fee: z
    .object({
      collected: z.boolean().describe('True only when status is "collected".'),
      status: FeeStatusSchema,
      txHash: z.string().optional().describe("Fee-collection tx hash, when one was sent."),
      error: z.string().optional(),
    })
    .optional()
    .describe("Present only when a fee is configured for this network."),
  extensions: z
    .object({
      facilitatorFees: z
        .object({
          info: FacilitatorFeePaidSchema,
        })
        .optional(),
    })
    .optional()
    .describe(
      "x402 v2 extensions. facilitatorFees, when present, discloses the fee assessed for " +
        "this payment per the #1016 disclosure proposal — see /supported for the full fee model.",
    ),
  extra: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Scheme-specific extras passed through from the underlying scheme (e.g. batch-settlement channel state).",
    ),
});

export type SettleResponseBody = z.infer<typeof SettleResponseSchema>;

// ── /supported ──

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
export const FacilitatorFeesDisclosureSchema = z.object({
  version: z.string(),
  model: z.string(),
  asset: z.string(),
  flatFee: z.string(),
  decimals: z.number().int(),
  recipient: z
    .string()
    .describe("Facilitator address that collects the fee (fee recipient / approval spender)."),
  networks: z.array(z.string()).describe("CAIP-2 networks this fee model applies to."),
  fee: z.object({
    amount: z.string(),
    description: z.string(),
    collection: z.string(),
  }),
  setup: z.object({
    description: z.string(),
    function: z.string(),
    spender: z.string(),
    recommended_amount: z.string(),
  }),
});

export type FacilitatorFeesDisclosure = z.infer<typeof FacilitatorFeesDisclosureSchema>;

/**
 * Shape of the `/supported` response. Matches `x402Facilitator.getSupported()` (whose
 * `extensions` is `string[]`) plus the optional top-level `facilitatorFees` disclosure.
 * `network` is `string` here to match the SDK class's return type; the base SDK
 * `SupportedResponse` narrows it to `Network`, but that distinction is irrelevant to
 * this response and forcing it would require casting the base return.
 */
export const SupportedResponseSchema = z.object({
  kinds: z
    .array(
      z.object({
        x402Version: z.number().int(),
        scheme: z.string(),
        network: z.string().describe("CAIP-2 network id."),
        extra: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .describe("Every supported (network, scheme) pair."),
  extensions: z
    .array(z.string())
    .describe("Advertised extension keys, e.g. facilitatorFees when a fee is configured."),
  signers: z
    .record(z.string(), z.array(z.string()))
    .describe("Facilitator address(es) per network."),
  facilitatorFees: FacilitatorFeesDisclosureSchema.optional().describe(
    "The full fee model disclosure (amount, recipient, recommended USDC approval) — " +
      "present only when a fee is configured.",
  ),
  /**
   * Onward paths for a caller that has just discovered `/supported` and has nowhere else
   * to go — an agent doing facilitator discovery, or a human who followed a link from a
   * listing. Always present, unlike `facilitatorFees`: it doesn't depend on a fee being
   * configured.
   */
  links: z.object({
    documentation: z.string(),
    source: z.string(),
    openapi: z.string(),
  }),
});

export type SupportedResponseBody = z.infer<typeof SupportedResponseSchema>;
