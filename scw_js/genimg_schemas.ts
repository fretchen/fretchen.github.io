/**
 * Zod schemas for the genimg endpoint's wire contract.
 *
 * Single source for both the runtime request validation in `genimg_x402_token.ts` and the
 * generated `openapi.genimg.json` (see `scripts/generate-openapi-genimg.ts`) — a shape change
 * here is a type error where it's inconsistent, and a `npm run generate:openapi:genimg` away
 * from being documented. Before this file existed, the OpenAPI spec was a hand-written second
 * description of the same shapes with nothing keeping the two in sync; that's how it ended up
 * advertising `tokenId` as a *required request field* the handler has never read, while omitting
 * `network` and `isListed` (both real, both sent by the website) and documenting a
 * `transaction_hash` that is never returned.
 *
 * Three deliberate differences from `x402_facilitator/x402_schemas.ts`, which this mirrors:
 *
 * 1. Scope is request *and* response. The facilitator kept its request schema shallow because
 *    `@x402/evm` validates those payloads internally and re-modeling them would duplicate the
 *    SDK. genimg is the opposite case: its request body is the actual user-facing contract, and
 *    was hand-validated with a separate `if` block per field.
 * 2. `ImageGenerationRequestSchema` is **strict**. Unknown fields are rejected, not ignored —
 *    this endpoint charges $0.07 per call, so silently dropping a `quality: "hd"` a caller
 *    believed in means taking money for a request we did not fulfil as asked. It also matches
 *    what the real OpenAI API does ("Unrecognized request argument supplied: ..."), and the
 *    principle `sc_llm_x402.ts` already applies to `stream: true` — reject what you would
 *    otherwise silently mishandle. `z.strictObject` renders as `additionalProperties: false`,
 *    so the strictness documents itself in the generated spec.
 * 3. The x402 payment payload stays **out** of the schema, for the facilitator's original
 *    reason — `@x402/evm` validates it, and `payment` is passed through as received.
 *
 * NOTE ON SCOPE: `ImageGenerationResponseSchema` deliberately describes the endpoint's response
 * as it is **today** — a flat object. The migration replaces it with an OpenAI-style
 * `{ created, data: [{ url }], x_nft }` envelope in a later step; documenting the envelope here
 * before the handler emits it would advertise a contract we do not serve. See
 * `genimg-openai-compat-migration.md` §4.
 */

import { z } from "zod";

// ── Request ──

/** Sizes this agent serves. Not a fixed set across `images/v1` implementers — see §1 of the migration doc. */
export const IMAGE_SIZES = ["1024x1024", "1792x1024"] as const;

/**
 * Model ids this endpoint advertises, mapped to the provider that serves them.
 *
 * Deliberately one entry. `image_service.ts` also has an `ionos` provider, but
 * `generateImageIONOS()` ignores `mode` and `referenceImageBase64` entirely — routing an edit
 * request there would silently return a fresh image instead of an edit. ionos becomes
 * selectable only once it supports edit mode or the handler rejects `mode: "edit"` for it.
 */
export const MODEL_TO_PROVIDER = { "flux-kontext-pro": "bfl" } as const;

export const ADVERTISED_MODELS = Object.keys(MODEL_TO_PROVIDER) as [keyof typeof MODEL_TO_PROVIDER];

export const ImageGenerationRequestSchema = z
  .strictObject({
    // Custom messages throughout: these reach callers as `error.message`, so they should read
    // like an API contract, not like a Zod internal ("Invalid input: expected string, received
    // undefined").
    prompt: z
      .string({ error: "No prompt provided" })
      .min(1, { error: "No prompt provided" })
      .describe("The text prompt to generate from."),
    model: z
      .enum(ADVERTISED_MODELS, {
        error: `The requested model does not exist or is not served by this endpoint. Available: ${Object.keys(MODEL_TO_PROVIDER).join(", ")}`,
      })
      .optional()
      .describe(
        `Model to generate with. Only the advertised id(s) are served: ${ADVERTISED_MODELS.join(", ")}. Defaults to ${ADVERTISED_MODELS[0]}.`,
      ),
    size: z
      .enum(IMAGE_SIZES, {
        error: `Invalid size parameter. Must be one of: ${IMAGE_SIZES.join(", ")}`,
      })
      .optional()
      .describe("Output image dimensions. Defaults to 1024x1024."),
    n: z
      .literal(1, {
        error: "Only n=1 is supported by this endpoint — pricing and the NFT mint are per-image.",
      })
      .optional()
      .describe("Number of images. Only 1 is supported — pricing and the NFT mint are per-image."),
    response_format: z
      .literal("url", {
        error:
          "Only response_format='url' is supported by this endpoint. Images are served from stable URLs.",
      })
      .optional()
      .describe(
        "Only 'url' is supported. Images are served from stable URLs; b64_json would push large bodies through a paid function for no benefit.",
      ),

    // ── Vendor extensions (not part of the OpenAI images body) ──
    mode: z
      .enum(["generate", "edit"], {
        error: "Invalid mode parameter. Must be one of: generate, edit",
      })
      .optional()
      .describe(
        "Vendor extension: 'edit' transforms `referenceImage` instead of generating fresh.",
      ),
    referenceImage: z
      .string()
      .optional()
      .describe("Vendor extension: base64-encoded source image. Required when mode is 'edit'."),
    network: z
      .string()
      .optional()
      .describe(
        "Vendor extension: CAIP-2 network id (e.g. eip155:10) to restrict the 402 payment offer to. Drives payment negotiation, not generation.",
      ),
    isListed: z
      .boolean()
      .optional()
      .describe(
        "Vendor extension: list the minted NFT in the public gallery. Alias of x_nft.listed.",
      ),
    x_nft: z
      .strictObject({
        listed: z.boolean().optional().describe("List the minted NFT in the public gallery."),
      })
      .optional()
      .describe("Vendor extension: NFT-specific options. Not part of the images/v1 floor."),
    payment: z
      .unknown()
      .optional()
      .describe(
        "Vendor extension: x402 payment payload, as a body fallback for clients that cannot set the PAYMENT-SIGNATURE / X-PAYMENT header. Passed through as received; validated by @x402/evm, not here.",
      ),
  })
  .describe(
    "OpenAI images-generation body plus this agent's vendor extensions. Unknown fields are rejected rather than ignored — see additionalProperties.",
  );

export type ImageGenerationRequest = z.infer<typeof ImageGenerationRequestSchema>;

// ── Response ──

export const ImageGenerationResponseSchema = z
  .object({
    image_url: z.string().describe("URL of the generated image."),
    metadata_url: z.string().describe("URL of the NFT metadata JSON."),
    tokenId: z.number().int().describe("Token id of the minted NFT."),
    mintTxHash: z.string().describe("Hash of the mint transaction."),
    transferTxHash: z.string().describe("Hash of the transfer to the payer."),
    payer: z.string().describe("Address the NFT was minted to, derived from the x402 payment."),
    network: z.string().describe("CAIP-2 network the mint settled on."),
    size: z.string().describe("Dimensions the image was generated at."),
    mode: z.string().describe("Whether the image was generated or edited."),
    isListed: z.boolean().describe("Whether the NFT was listed in the public gallery."),
    mintPrice: z.string().describe("Mint price paid on-chain, in wei."),
    message: z.string().describe("Human-readable summary."),
  })
  .describe("Successful generation and mint.");

export type ImageGenerationResponse = z.infer<typeof ImageGenerationResponseSchema>;
