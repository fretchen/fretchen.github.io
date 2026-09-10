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
 * Named for genimg specifically because `scw_js` has two spec files, both now generated this way.
 * The parts common to both live in `scripts/openapi-codegen.ts`.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ImageGenerationRequestSchema, ImageGenerationResponseSchema } from "../genimg_schemas.js";
import {
  CONTACT,
  openApiJsonPath,
  toComponentSchema,
  writeSpec,
  type ServiceSpec,
} from "./openapi-codegen.js";

/**
 * `x-capabilities` is optional on `ServiceSpec` but required here: the NFT mint sits outside the
 * interop floor, so dropping it would hide a capability the endpoint still performs.
 */
type GenimgSpec = ServiceSpec<
  "images/v1",
  "ImageGenerationRequest" | "ImageGenerationResponse",
  { protocols: readonly ["x402"]; price: { mode: "fixed"; currency: "USD"; amount: string } }
> & { "x-capabilities": readonly ["nft-mint"] };

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "openapi.genimg.json");

export function generateOpenApiSpec(): GenimgSpec {
  return {
    openapi: "3.1.0",
    info: {
      title: "Fretchen AI Image Generation Service",
      description:
        "AI-powered image generation with NFT minting on Optimism/Base, paid via x402 USDC.",
      version: "1.0.0",
      "x-guidance":
        "OpenAI images-generation body. POST / with { prompt, size } and no payment header to receive a 402 with x402 v2 payment requirements (accepts[]). Pay in USDC on one of the offered networks, retry with the payment header, and the service returns { created, data: [{ url }], model } — data[0].url is the image. The mint recipient is derived from the payment payload, so there is no recipient field. Unknown request fields are rejected, not ignored. This agent also mints the image as an NFT and reports it under the x_nft response extension; that is a declared capability, not part of the images/v1 contract, and a client that only wants an image can ignore it. A 200 does not by itself mean the NFT was minted — check x_nft.status. Note: payment uses x402, so a stock OpenAI SDK cannot pay this endpoint — the OpenAI shape is for body legibility, not drop-in SDK use. Testnet networks return a placeholder image rather than a generated one.",
      contact: CONTACT,
    },
    "x-discovery": {
      ownershipProofs: [
        "0x8af9242b0056decb756ccd803fa791f7bd022f3f4973e9f84fec58ab3ab9160305a35b947c9a817146b91e7b61b49a1eea8eaa5832bc80682fb7b6fbba737e4f1b",
      ],
    },
    "x-service-type": "images/v1",
    "x-interop-floor":
      "A compatible images/v1 agent MUST accept an OpenAI images-generation body ({ prompt, model?, size?, n?, response_format? }), MUST support size 1024x1024 (other sizes are per-agent and advertised in its own schema), MUST return { created, data: [{ url }] } with a fetchable URL rather than base64, and MUST advertise at least one accepts[] entry with asset USDC on network Optimism (eip155:10) or Base (eip155:8453), scheme exact. Request/response schema is defined by this document's ImageGenerationRequest/ImageGenerationResponse. Minting an NFT is NOT part of the floor — see x-capabilities. See README.md.",
    // The NFT sits deliberately outside the interop floor: requiring it would mean a second
    // implementer needed an NFT contract, a funded agent wallet and a transfer flow, which is
    // the opposite of interchangeable. Declared here so a client can detect it instead.
    "x-capabilities": ["nft-mint"],
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
      "/openapi.json": openApiJsonPath("x402"),
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
  writeSpec(OUTPUT_PATH, generateOpenApiSpec());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
