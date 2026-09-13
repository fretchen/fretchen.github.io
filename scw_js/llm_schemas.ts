/**
 * Zod schemas for the LLM endpoint's wire contract.
 *
 * Single source for the generated `openapi.llm.json` (see `scripts/generate-openapi-llm.ts`).
 *
 * **The rule: forward the body, reject only what moves cost past the metered ceiling.** The body
 * goes to the upstream model, which owns the chat-param contract — an unlisted OpenAI param
 * (`temperature`, `top_p`, `seed`, …) is passed through and simply works. But this endpoint meters
 * each message against a fixed ceiling (2000 output tokens ≈ $0.003, see `sc_llm_x402.ts`), so
 * `stream`, `n` and `max_tokens` are rejected; see `REJECTED_PARAMS` below for why each. `tools` is
 * the middle case: capped rather than refused, since a caller can inflate it.
 *
 * Hence `z.looseObject` on the request side — `z.object` publishes `additionalProperties: false`,
 * a strictness the handler does not enforce (see the OpenAPI rule in the repo `CLAUDE.md`). The
 * response side stays `z.object`: `callLLMAPI` reconstructs the envelope field by field.
 *
 * These schemas are PUBLISHED UI: `website/pages/agent-onboarding` and `website/pages/x402/buyers`
 * render them from the live deployed spec via `SpecParamTable`. Every `.describe()` below is
 * user-facing copy, and the exported schema *names* are load-bearing — renaming either breaks
 * both pages.
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

// ── Tools ──

export const MAX_TOOLS = 8;
export const MAX_TOOLS_BYTES = 8192;

/** One tool call the model wants made. `arguments` is a JSON *string*, per OpenAI. */
export const LLMToolCallSchema = z.looseObject({
  id: z.string().describe("Echo this back as tool_call_id on the matching tool result message."),
  type: z.literal("function"),
  function: z.looseObject({
    name: z.string(),
    arguments: z.string().describe("JSON-encoded arguments, as a string."),
  }),
});

/**
 * Tool definitions a caller may offer the model. `function.parameters` stays loose: it is a JSON
 * Schema the upstream model owns.
 *
 * The byte cap is a `.refine()`, which `z.toJSONSchema` does not render, so it is restated in the
 * `.describe()` on the request field. We enforce slightly more than we publish — the safe
 * direction, but a real gap: `maxItems` publishes itself, the byte cap cannot.
 */
export const LLMToolsSchema = z
  .array(
    z.looseObject({
      type: z.literal("function"),
      function: z.looseObject({
        name: z.string().min(1),
        description: z.string().optional(),
        parameters: z.looseObject({}).optional(),
      }),
    }),
  )
  .max(MAX_TOOLS)
  .refine((tools) => Buffer.byteLength(JSON.stringify(tools), "utf8") <= MAX_TOOLS_BYTES, {
    error: `tools must serialize to at most ${MAX_TOOLS_BYTES} bytes`,
  });

// ── Request ──

export const LLMChatMessageSchema = z
  .looseObject({
    role: z
      .string()
      .describe(
        'The speaker\'s role. Forwarded to the upstream model as sent — deliberately not restricted to the OpenAI "system"/"user"/"assistant" set, so a role the upstream adds later (e.g. "tool") works without a schema change, matching how the handler validates it.',
      ),
    content: z
      .string()
      .nullable()
      .optional()
      .describe(
        "The message text. Required except on an assistant turn that carries tool_calls, where it is null.",
      ),
    tool_calls: z
      .array(LLMToolCallSchema)
      .min(1) // an assistant turn either carries a tool call or omits the key — never []
      .nullable() // a caller replaying an upstream turn verbatim sends the null; see upstream_schemas.ts
      .optional()
      .describe("Present when replaying an assistant turn that requested tool calls."),
    tool_call_id: z
      .string()
      .optional()
      .describe("On a role:'tool' message, the id of the call this message answers."),
  })
  .describe("One turn of the conversation.")
  // Array.isArray, not `!== undefined`: null !== undefined is true, so that check would accept
  // a genuinely empty {content: null, tool_calls: null} turn now that tool_calls is nullable.
  .refine((m) => (m.content !== null && m.content !== undefined) || Array.isArray(m.tool_calls), {
    error: "message must have content unless it carries tool_calls",
  });

/**
 * The params rejected with a 400 because they move cost past the metered ceiling.
 *
 * One list, three consumers: the schema fields below (`doc`), the handler's rejection loop in
 * `sc_llm_x402.ts`, and the generated 400 description and x-guidance (`specPhrase`/`name`). `n`
 * and `max_tokens` once became 400 causes the published spec never mentioned; this is what stops
 * that recurring.
 */
export interface RejectedParam {
  readonly name: string;
  readonly predicate: (value: unknown) => boolean;
  readonly code: string;
  /** OpenAI error `param`. Omitted for stream, whose wire shape predates the param field. */
  readonly errorParam?: string;
  readonly message: string;
  /** The schema field's `.describe()` — published UI, hence separate copy from `message`. */
  readonly doc: string;
  readonly specPhrase: string;
}

// Annotated rather than `as const satisfies`, which narrows each entry to its own literal type and
// leaves `errorParam` missing from the `stream` member of the union.
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
    // Only the prose comes from REJECTED_PARAMS; the constraints must stay literal, because
    // OWN_REQUEST_KEYS reads Object.keys(shape) and z.infer would lose the field types.
    stream: z.literal(false).optional().describe(rejected("stream").doc),
    n: z.literal(1).optional().describe(rejected("n").doc),
    max_tokens: z.never().optional().describe(rejected("max_tokens").doc),
    tools: LLMToolsSchema.optional().describe(
      `Tool definitions offered to the model, OpenAI shape. At most ${MAX_TOOLS}, and at most ${MAX_TOOLS_BYTES} bytes serialized — tool definitions are input tokens charged on every hop, so an uncapped array inflates the metered cost. A tool call comes back as choices[].message.tool_calls with finish_reason: "tool_calls"; execute it and send the result back as a role:"tool" message. This endpoint never calls a tool itself.`,
    ),
    tool_choice: z
      .enum(["auto", "none"])
      .optional()
      .describe(
        'Whether the model may call a tool. Only "auto" and "none" are served; a forced or named choice is not.',
      ),
    useDummyData: z
      .boolean()
      .optional()
      .describe(
        "Vendor extension (not OpenAI): forces a mock completion. Testnet networks always mock regardless. The mock is tool-aware — offered a tool with no result in the conversation yet it returns a tool_calls turn, and once a role:'tool' message is present it answers with text — so the whole tool loop can be exercised without a billed completion.",
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

/**
 * Keys declared above that must still be sent upstream.
 *
 * `sc_llm_x402.ts` strips every declared key from the bag it forwards, on the principle that a
 * declared key is one this endpoint handles itself. `tools`/`tool_choice` are the exception — the
 * model is the thing that has to see them. Without this set they would be silently dropped and the
 * caller charged for a completion that ignored their tools.
 */
export const FORWARDED_OWN_KEYS = new Set<string>(["tools", "tool_choice"]);

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
          content: z
            .string()
            .nullable()
            .describe("The generated reply, or null when the model is requesting a tool call."),
          tool_calls: z
            .array(LLMToolCallSchema)
            .min(1)
            .optional()
            .describe(
              "Present only when finish_reason is tool_calls. Execute them and send the results back as role:'tool' messages carrying the matching tool_call_id.",
            ),
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
