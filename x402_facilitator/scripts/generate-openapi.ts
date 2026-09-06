/**
 * Generates `openapi.json` from the Zod schemas in `x402_schemas.ts`.
 *
 * Run via `npm run generate:openapi` (also runs automatically as part of `npm run
 * build`/`predeploy`). `test/openapi_generation.test.ts` re-runs this same logic and
 * deep-equals it against the committed file — that test is what actually enforces
 * "run this after changing a schema," not this script alone.
 *
 * Only `components.schemas` is generated. `info`, `servers`, `tags`, and `paths` are
 * prose — summaries, descriptions, guidance for callers — not data shapes, so they
 * gain nothing from codegen and stay hand-written below, verbatim from the previous
 * hand-maintained `openapi.json`.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import {
  PaymentRequestSchema,
  VerifyResponseSchema,
  SettleResponseSchema,
  SupportedResponseSchema,
} from "../x402_schemas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "openapi.json");

/**
 * zod's `toJSONSchema` stamps a top-level `$schema` key (correct for a standalone JSON
 * Schema document) — meaningless nested under `components.schemas.<Name>` in an
 * OpenAPI document, which declares its schema dialect once, globally, via
 * `"openapi": "3.1.0"`. Strip it.
 */
function toComponentSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _$schema, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

export function generateOpenApiSpec(): object {
  return {
    openapi: "3.1.0",
    info: {
      title: "fretchen x402 Facilitator",
      description:
        "x402 v2 facilitator: verifies and settles USDC payments on Optimism and Base. This is protocol infrastructure a seller (resource server) integrates against, not a paid resource — a buyer never calls these endpoints directly; the seller relays a buyer's signed payment payload here to verify and settle it. The facilitator never holds funds and is not a custodian.",
      version: "1.0.0",
      "x-guidance":
        "Sellers: on receiving a request with a payment header, POST { paymentPayload, paymentRequirements } to /verify before delivering the resource, then POST the same body to /settle after delivery. GET /supported once to discover which networks, schemes, and fee model this facilitator advertises. There is no request body for /supported.",
      contact: {
        name: "fretchen",
        url: "https://www.fretchen.eu",
        email: "fretchen.dev@proton.me",
      },
    },
    servers: [{ url: "https://facilitator.fretchen.eu" }],
    tags: [{ name: "x402", description: "x402 v2 payment verification and settlement" }],
    paths: {
      "/verify": {
        post: {
          operationId: "verify",
          summary: "Verify a signed payment off-chain, before delivering the resource",
          description:
            "Called by a seller after receiving a payment header from a buyer. Checks signature validity, sufficient balance, correct recipient, and expiration. Does not move funds. Call this before delivering the resource; call /settle after.",
          tags: ["x402"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentRequest" },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Verification result. A 200 status does not imply the payment was valid — check isValid.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/VerifyResponse" },
                },
              },
            },
            "400": {
              description:
                "Request body was not valid JSON, or was missing paymentPayload/paymentRequirements.",
            },
            "405": { description: "Method not allowed — use POST." },
          },
        },
      },
      "/settle": {
        post: {
          operationId: "settle",
          summary: "Settle a verified payment on-chain",
          description:
            "Called by a seller after delivering the resource. Executes the payment on-chain (EIP-3009 transferWithAuthorization for the exact scheme). Same request shape as /verify.",
          tags: ["x402"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentRequest" },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Settlement result. A 200 status does not imply the settlement succeeded — check success.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SettleResponse" },
                },
              },
            },
            "400": {
              description:
                "Request body was not valid JSON, or was missing paymentPayload/paymentRequirements.",
            },
            "405": { description: "Method not allowed — use POST." },
          },
        },
      },
      "/supported": {
        get: {
          operationId: "supported",
          summary: "Discover the networks, schemes, and fee model this facilitator advertises",
          description:
            "Called once by a seller (or a buyer's client) to learn what this facilitator supports, before ever calling /verify or /settle. No request body.",
          tags: ["x402"],
          responses: {
            "200": {
              description: "Supported capabilities.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SupportedResponse" },
                },
              },
            },
            "405": { description: "Method not allowed — use GET." },
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
        PaymentRequest: toComponentSchema(PaymentRequestSchema),
        VerifyResponse: toComponentSchema(VerifyResponseSchema),
        SettleResponse: toComponentSchema(SettleResponseSchema),
        SupportedResponse: toComponentSchema(SupportedResponseSchema),
      },
    },
  };
}

function main() {
  const spec = generateOpenApiSpec();
  // Written unformatted, then Prettier'd by the npm script — the repo's `format:check`
  // covers openapi.json, so a raw JSON.stringify here would make every regeneration
  // fail `npm run check`. The golden-file test compares parsed JSON, so formatting
  // never affects it either way.
  writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2) + "\n");
  console.log(`Generated ${OUTPUT_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
