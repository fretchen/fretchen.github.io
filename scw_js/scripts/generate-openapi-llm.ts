/**
 * Generates `openapi.llm.json` from the Zod schemas in `llm_schemas.ts`.
 *
 * Run via `npm run generate:openapi:llm` (also runs as part of `npm run build`/`deploy`).
 * `test/openapi_llm_generation.test.ts` re-runs this logic and deep-equals it against the committed
 * file — that test is what actually enforces "regenerate after changing a schema", not this script.
 * `npm run check` does not run `build`, so the test is the only enforcement.
 *
 * Only `components.schemas` is generated. `info`, `servers`, `tags`, `paths`, `x-service-type`,
 * `x-interop-floor` and `x-discovery` are prose and contract declarations, not data shapes, and stay
 * hand-written below.
 *
 * ⚠️ Three things here are load-bearing beyond looking correct:
 *
 * 1. `paths["/"].post["x-payment-info"].price.max` must stay present. `sc_llm_x402.ts` mutates it on
 *    a `structuredClone` at serve time, because the static value is a documentation-only baseline
 *    while `USDC_MAX_PRICE_PER_MESSAGE` is the real live ceiling. Removing the key, or changing the
 *    shape so the imported JSON's inferred type no longer permits the assignment, breaks that line
 *    at compile time.
 * 2. `x-service-type` must remain exactly `"llm/v1"`. `precheckLlmV1Agent` and `checkLlmV1Agent` in
 *    `website/hooks/x402Discovery.ts` test it with `===`, so any other value makes this agent fail
 *    its own compatibility checker.
 * 3. `x-discovery.ownershipProofs` is a signature over the origin. It cannot be regenerated here —
 *    copy it forward verbatim.
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LLMChatRequestSchema, LLMChatResponseSchema } from "../llm_schemas.js";
import { CONTACT, openApiJsonPath, toComponentSchema, writeSpec } from "./openapi-codegen.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "openapi.llm.json");

export function generateOpenApiSpec(): object {
  return {
    openapi: "3.1.0",
    info: {
      title: "Fretchen AI Assistant (LLM) Service",
      description: "AI chat assistant, paid via x402 batch-settlement USDC payment channels.",
      version: "1.0.0",
      "x-guidance":
        "OpenAI chat-completions body. POST / with { model, messages: [{ role, content }, ...] } and no payment header to receive a 402 with x402 batch-settlement payment requirements (accepts[]). Open/top up a payment channel per the requirements, retry with the payment header, and the service returns a standard OpenAI chat.completion object. Streaming (stream: true) is not supported. Each message is metered and settled up to a per-message price ceiling; the real cost is usage-derived and typically lower. Other standard OpenAI chat params (temperature, top_p, stop, seed, the penalties, response_format) are forwarded to the upstream model and work as normal; they are not enumerated here because the upstream owns that contract. The exceptions are stream, n and max_tokens, which are rejected with a 400 rather than ignored, because each would move cost past the fixed per-message ceiling this endpoint meters against. Note: payment uses x402 batch-settlement (a stateful channel), so a stock OpenAI SDK cannot pay this endpoint without batch-settlement client wiring — the OpenAI shape is for body legibility, not drop-in SDK use.",
      contact: CONTACT,
    },
    "x-discovery": {
      // A signature over the origin — cannot be regenerated, carried forward verbatim.
      ownershipProofs: [
        "0x08fd2874a7a85b7250830bf6be396953c108e197739ccc758e373036b2fe78a71ddcaf48183690b5f1d2a0049eb0af93068fb35eaaf59d266168eaeea1df357d1c",
      ],
    },
    // Exactly "llm/v1" — see the header note. Tool support, when it lands, is advertised as a
    // capability rather than a version bump, so this string does not move.
    "x-service-type": "llm/v1",
    "x-interop-floor":
      "A compatible llm/v1 agent MUST advertise at least one accepts[] entry with asset USDC on network Optimism (eip155:10) or Base (eip155:8453), scheme batch-settlement. Request/response schema is defined by this document's LLMChatRequest/LLMChatResponse. See README.md.",
    servers: [{ url: "https://llm-agent.fretchen.eu" }],
    tags: [
      { name: "LLM", description: "AI chat assistant / text completion" },
      { name: "Chat", description: "Multi-turn conversational messages" },
      { name: "x402", description: "Paid via x402 batch-settlement USDC payment channels" },
    ],
    paths: {
      "/": {
        post: {
          operationId: "llmX402",
          summary: "Chat with the AI assistant (x402 batch-settlement USDC payment)",
          description:
            "Sends a prompt to the LLM and returns its response. Payment is settled per message via an x402 batch-settlement USDC payment channel, capped at a per-message price ceiling.",
          tags: ["LLM", "Chat", "x402"],
          security: [],
          "x-payment-info": {
            protocols: ["x402"],
            // price.max is overwritten at serve time from the live ceiling — see header note 1.
            price: { mode: "dynamic", currency: "USD", min: "0", max: "0.003" },
          },
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LLMChatRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "LLM response generated and payment settled successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LLMChatResponse" },
                },
              },
            },
            "400": {
              description:
                "Request validation failed — a missing or unserved model, an empty messages array, or stream:true. Body is { error: { message, type, code } }.",
            },
            "402": {
              description:
                "Payment required. Body/headers (Payment-Required, X-Payment) carry the x402 batch-settlement payment requirements to satisfy and retry with.",
            },
          },
        },
      },
      "/openapi.json": openApiJsonPath("x402"),
    },
    components: {
      schemas: {
        LLMChatRequest: toComponentSchema(LLMChatRequestSchema),
        LLMChatResponse: toComponentSchema(LLMChatResponseSchema),
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
