/**
 * Generates `openapi.genimg.json` from the Zod schemas in `genimg_schemas.ts`.
 *
 * Run via `npm run generate:openapi:genimg` (also runs automatically as part of `npm run
 * build`/`deploy`). `test/openapi_genimg_generation.test.ts` re-runs this same logic and
 * deep-equals it against the committed file — that test is what actually enforces
 * "regenerate after changing a schema", not this script alone. `npm run check` does not
 * run `build`, so the test is the only thing standing between a schema edit and a stale
 * committed spec.
 *
 * Only `components.schemas` is generated. `info`, `servers`, `tags`, and `paths` are prose —
 * summaries, descriptions, guidance for callers — not data shapes, so they gain nothing from
 * codegen and stay hand-written below.
 *
 * Named for genimg specifically because `scw_js` has two spec files; `openapi.llm.json` is
 * still hand-maintained and converting it the same way is a natural follow-up.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { ImageGenerationRequestSchema, ImageGenerationResponseSchema } from "../genimg_schemas.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "openapi.genimg.json");

/**
 * zod's `toJSONSchema` stamps a top-level `$schema` key (correct for a standalone JSON Schema
 * document) — meaningless nested under `components.schemas.<Name>` in an OpenAPI document,
 * which declares its schema dialect once, globally, via `"openapi": "3.1.0"`. Strip it.
 */
function toComponentSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema["$schema"];
  return jsonSchema;
}

export function generateOpenApiSpec(): object {
  return {
    openapi: "3.1.0",
    info: {
      title: "Fretchen AI Image Generation Service",
      description:
        "AI-powered image generation with NFT minting on Optimism/Base, paid via x402 USDC.",
      version: "1.0.0",
      "x-guidance":
        "POST / with { prompt, size } and no payment header to receive a 402 with x402 v2 payment requirements (accepts[]). Pay in USDC on one of the offered networks, retry with the payment header, and the service generates the image, mints it as an NFT, and transfers it to the payer. The mint recipient is derived from the payment payload, so there is no recipient field. Unknown request fields are rejected, not ignored. Note: payment uses x402, so a stock OpenAI SDK cannot pay this endpoint — the OpenAI body shape is for legibility, not drop-in SDK use. Testnet networks return a placeholder image rather than a generated one.",
      contact: {
        name: "fretchen",
        url: "https://www.fretchen.eu",
        email: "fretchen.dev@proton.me",
      },
    },
    "x-discovery": {
      ownershipProofs: [
        "0x8af9242b0056decb756ccd803fa791f7bd022f3f4973e9f84fec58ab3ab9160305a35b947c9a817146b91e7b61b49a1eea8eaa5832bc80682fb7b6fbba737e4f1b",
      ],
    },
    servers: [{ url: "https://imagegen-agent.fretchen.eu" }],
    tags: [
      { name: "Image Generation", description: "AI text-to-image and image editing" },
      { name: "NFT", description: "Mints the result as an NFT on Optimism/Base" },
      { name: "x402", description: "Paid via x402 USDC payments" },
    ],
    paths: {
      "/": {
        post: {
          operationId: "genimgX402Token",
          summary: "Generate AI Image and Mint NFT (x402 USDC payment)",
          description:
            "Generates an AI image using Black Forest Labs (BFL), uploads it to S3, mints an NFT on Optimism/Base, and transfers it to the payer. Requires x402 USDC payment. An unpaid request is answered with the 402 challenge whatever its body says, so a client can always discover the payment terms; a paid request is validated before anything is verified or settled.",
          tags: ["Image Generation", "NFT", "x402"],
          security: [],
          "x-payment-info": {
            protocols: ["x402"],
            price: { mode: "fixed", currency: "USD", amount: "0.07" },
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ImageGenerationRequest" },
              },
            },
          },
          responses: {
            "200": {
              description:
                "The image was generated. A 200 does not by itself mean the NFT was minted — check x_nft.status.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ImageGenerationResponse" },
                },
              },
            },
            "400": {
              description:
                "Request validation failed — missing prompt, an unsupported value, or an unrecognized field. Body is { error: { message, type, code } }.",
            },
            "402": {
              description:
                "Payment required. Body/headers (Payment-Required, X-Payment) carry the x402 v2 payment requirements to satisfy and retry with.",
            },
          },
        },
      },
      "/openapi.json": {
        get: {
          operationId: "openapiSpec",
          summary: "This document",
          tags: ["x402"],
          responses: {
            "200": {
              description: "This OpenAPI document.",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        ImageGenerationRequest: toComponentSchema(ImageGenerationRequestSchema),
        ImageGenerationResponse: toComponentSchema(ImageGenerationResponseSchema),
      },
    },
  };
}

function main() {
  const spec = generateOpenApiSpec();
  // Written unformatted, then Prettier'd by the npm script — the repo's `format:check`
  // covers openapi.genimg.json, so a raw JSON.stringify here would make every regeneration
  // fail `npm run check`. The golden-file test compares parsed JSON, so formatting never
  // affects it either way.
  writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2) + "\n");
  console.log(`Generated ${OUTPUT_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
