/**
 * Zod schemas for the LLM endpoint's wire contract.
 *
 * Single source for the generated `openapi.llm.json` (see `scripts/generate-openapi-llm.ts`).
 * Before this file existed the spec was a hand-written second description of shapes the handler
 * already knew, with nothing keeping the two in sync — and it had drifted: `payment` (the x402
 * body fallback) and `stream` (read and rejected with a 400) were both absent from
 * `components.schemas`, discoverable only from the `x-guidance` prose. A machine reading the schema
 * could not find either.
 *
 * **Permissive by design, not by neglect.** The body is forwarded to the upstream model, so Mistral
 * owns the chat-param contract the same way `@x402/evm` owns the payment-payload contract in
 * `x402_facilitator`. An unlisted OpenAI param (`temperature`, `top_p`, `stop`, `seed`, the
 * penalties, `response_format`) is passed through and simply works, rather than being silently
 * dropped — which is what would make charging for it dishonest — or rejected, which would make this
 * a worse API than the one it imitates.
 *
 * The disanalogy with the facilitator is **cost**, and it is what the exceptions are derived from.
 * The facilitator's passthrough is cost-neutral; ours is not, because this endpoint meters each
 * message against a fixed ceiling (2000 output tokens ≈ $0.003, see `sc_llm_x402.ts`). So the rule
 * is: forward the body, and reject only what moves cost past that ceiling.
 *
 *   `stream`      — settlement needs final usage, which needs the whole completion
 *   `n`           — multiplies completions; `n: 5` is ~5x output against a fixed ceiling
 *   `max_tokens`  — directly sets output length; 8000 is ~$0.012 against a $0.003 ceiling
 *
 * Those three are declared below so the published schema names them rather than leaving a caller to
 * discover the 400. Everything else is deliberately unenumerated: an allow-list would need editing
 * every time the upstream adds a param, and would reject params that cost us nothing.
 *
 * The same reasoning covers `tools` when it lands — cap what the caller can inflate (definition
 * count and serialized size), forward the rest.
 *
 * Mechanically that means `z.looseObject` on the request side, not `z.object`. `z.object` strips
 * unknown keys at parse time but `z.toJSONSchema` renders it as `additionalProperties: false`,
 * publishing a strictness the handler does not enforce. `x402_facilitator/openapi.json` has exactly
 * that bug today — all four of its schemas advertise `additionalProperties: false` while the
 * facilitator enforces none of it. The response side here stays `z.object`: `callLLMAPI`
 * reconstructs the envelope field by field rather than forwarding upstream extras, so
 * `additionalProperties: false` there is true.
 *
 * These schemas are PUBLISHED UI: `website/pages/agent-onboarding` and `website/pages/x402/buyers`
 * both render `components.schemas.LLMChatRequest`/`LLMChatResponse` from the live deployed spec via
 * `SpecParamTable`. Every `.describe()` below is user-facing copy, and the exported schema *names*
 * are load-bearing — renaming either breaks both pages.
 */

import { z } from "zod";
import { advertisedModelIds } from "./llm_service.js";

/**
 * The model ids this endpoint advertises. Derived from `advertisedModelIds()` in `llm_service.ts`
 * (the runtime source of truth, keyed off `LLM_PROVIDERS`) rather than hand-copied, so the
 * published `model` enum cannot list a model the endpoint doesn't serve, or omit one it does.
 * `llm_service.ts` does not import this file, so the dependency direction is safe.
 */
export const ADVERTISED_LLM_MODELS = advertisedModelIds() as [string, ...string[]];

// ── Request ──

export const LLMChatMessageSchema = z
  .looseObject({
    role: z
      .string()
      .describe(
        'The speaker\'s role. Forwarded to the upstream model as sent — deliberately not restricted to the OpenAI "system"/"user"/"assistant" set, so a role the upstream adds later (e.g. "tool") works without a schema change, matching how the handler validates it.',
      ),
    content: z.string().describe("The message text."),
  })
  .describe("One turn of the conversation.");

/**
 * One entry per param rejected with a 400 because it moves cost past the metered per-message
 * ceiling. See the header for why these three and nothing else.
 *
 * Three consumers, one list: the schema fields below take their `.describe()` copy from `doc`,
 * `sc_llm_x402.ts` loops the list to produce the 400s, and `scripts/generate-openapi-llm.ts`
 * builds the published 400 description and `x-guidance` prose from `specPhrase`/`name`. Adding a
 * fourth cost-mover (`tools`, when it lands) is one entry here plus its schema field — the
 * published description cannot drift from what is enforced, which is exactly how `n` and
 * `max_tokens` once became 400 causes that the spec never mentioned.
 */
export interface RejectedParam {
  /** Request-body key. Also its key in `LLMChatRequestSchema.shape`, hence in OWN_REQUEST_KEYS. */
  readonly name: string;
  /** True when the value present in the body must be rejected. */
  readonly predicate: (value: unknown) => boolean;
  /** OpenAI error `code`. */
  readonly code: string;
  /** OpenAI error `param`. Omitted for stream, whose wire shape predates the param field. */
  readonly errorParam?: string;
  /** The 400 response message. Wire copy — asserted by test/sc_llm_x402.test.ts. */
  readonly message: string;
  /**
   * The schema field's `.describe()`. PUBLISHED UI (SpecParamTable) — deliberately a separate
   * string from `message`: one is documentation a caller reads before sending, the other is an
   * error a caller reads after. They sit adjacent here so drift between them is a two-line diff.
   */
  readonly doc: string;
  /** How this param is named in the generated 400 description prose. */
  readonly specPhrase: string;
}

// Annotated rather than `as const satisfies`: under `as const` each entry narrows to its own
// literal type, and `errorParam` then does not exist on the `stream` member of the union, so the
// handler's loop cannot read it uniformly.
export const REJECTED_PARAMS: readonly RejectedParam[] = [
  {
    name: "stream",
    predicate: (v: unknown) => v === true,
    code: "stream_unsupported",
    message: "Streaming (stream: true) is not supported by this endpoint.",
    doc: "Streaming is not supported. Each message settles on its final token usage, which requires the whole completion, so stream:true is rejected rather than silently buffered.",
    specPhrase: "stream:true",
  },
  {
    name: "n",
    predicate: (v: unknown) => v !== undefined && v !== 1,
    code: "unsupported_value",
    errorParam: "n",
    message:
      "Only n=1 is supported. Each message is metered against a fixed per-message price ceiling, and additional completions multiply output tokens past it.",
    doc: "Only n=1 is supported. Each message is metered against a fixed per-message price ceiling, and additional completions multiply output tokens past it.",
    specPhrase: "n other than 1",
  },
  {
    name: "max_tokens",
    predicate: (v: unknown) => v !== undefined,
    code: "unsupported_value",
    errorParam: "max_tokens",
    message:
      "'max_tokens' is not supported. Output length is bounded by the per-message price ceiling this endpoint meters against, not by a caller-supplied limit.",
    doc: "Not supported. Output length is bounded by the per-message price ceiling this endpoint meters against, not by a caller-supplied limit.",
    specPhrase: "any max_tokens",
  },
];

/**
 * Pull one entry's copy by name, so the schema fields below read as declarations rather than
 * index juggling. Throws at module load if the name is wrong — a typo here would otherwise
 * silently publish an undefined description.
 */
function rejected(name: string): RejectedParam {
  const param = REJECTED_PARAMS.find((p) => p.name === name);
  if (!param) {
    throw new Error(`No REJECTED_PARAMS entry named '${name}'`);
  }
  return param;
}

export const LLMChatRequestSchema = z
  .looseObject({
    model: z
      .enum(ADVERTISED_LLM_MODELS)
      .describe(
        "The model to use. Only the advertised model id(s) are served; others return model_not_found.",
      ),
    messages: z.array(LLMChatMessageSchema).min(1).describe("The conversation so far."),
    // The three cost-movers. Declared so the published schema names them and a caller sees the
    // constraint before hitting the 400 — everything else is forwarded and left unenumerated.
    // The constraints stay literal (not generated from REJECTED_PARAMS) because each is a
    // different kind — const false, const 1, never — and because OWN_REQUEST_KEYS reads
    // Object.keys(shape): a spread would make the forwarded-bag filter depend on construction
    // order, and z.infer would lose the field types. Only the prose comes from the list.
    stream: z.literal(false).optional().describe(rejected("stream").doc),
    n: z.literal(1).optional().describe(rejected("n").doc),
    max_tokens: z.never().optional().describe(rejected("max_tokens").doc),
    useDummyData: z
      .boolean()
      .optional()
      .describe(
        "Vendor extension (not OpenAI): forces a mock completion. Testnet networks always mock regardless.",
      ),
    payment: z
      .unknown()
      .optional()
      .describe(
        "Vendor extension: x402 payment payload, as a body fallback for clients that cannot set the PAYMENT-SIGNATURE / X-PAYMENT header. Passed through as received; validated by @x402/evm, not here.",
      ),
  })
  .describe(
    "OpenAI chat-completions request body, plus this agent's vendor extensions. Unlisted fields are forwarded to the upstream model rather than dropped or rejected — except stream, n and max_tokens, which are rejected with a 400 because they move cost past the metered per-message ceiling.",
  );

export type LLMChatRequest = z.infer<typeof LLMChatRequestSchema>;

// ── Response ──

export const LLMChatResponseSchema = z
  .object({
    id: z.string(),
    object: z.literal("chat.completion"),
    created: z.number().int().describe("Unix timestamp (seconds)."),
    model: z.string(),
    choices: z.array(
      z.object({
        index: z.number().int(),
        message: z.object({
          role: z.string(),
          content: z.string().describe("The generated reply."),
        }),
        finish_reason: z.string().nullable(),
      }),
    ),
    usage: z
      .object({
        prompt_tokens: z.number().int(),
        completion_tokens: z.number().int(),
        total_tokens: z.number().int(),
      })
      .describe("Token usage; the settled charge is derived from it."),
  })
  .describe("OpenAI chat.completion object.");

export type LLMChatResponse = z.infer<typeof LLMChatResponseSchema>;
