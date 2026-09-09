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
 * **Not strict — because that is what the handler currently does, not because it is right.**
 * `genimg_schemas.ts` rejects unknown fields, and the argument there transfers: this is also a paid
 * endpoint, so silently dropping a `temperature: 0` a caller believed in means charging for a
 * request not fulfilled as asked. Being lenient here is a wart, not a principle.
 *
 * It is left alone in this file because this file's job is to make the published spec describe
 * *current* behaviour. Tightening it is a behaviour change, and smuggling one into a codegen
 * refactor is how a "no functional change" PR ends up shipping a functional change.
 *
 * Tightening it is also not a one-word flip, which is the real reason it is sequenced separately.
 * An OpenAI-chat-shaped endpoint has a large surface of standard params callers plausibly send —
 * `temperature`, `top_p`, `max_tokens`, `seed`, `stop`, `presence_penalty`, `frequency_penalty`,
 * `n`, `response_format`, `logprobs`, `user`. Strict rejects all of them, and for the two that
 * matter most (`temperature`, `max_tokens`, both accepted by Mistral) *supporting* them beats both
 * rejecting and ignoring. So the work is "decide the param surface", then close the schema.
 *
 * It becomes more urgent once `tools` lands: a caller sending `tool_choice: "required"` (valid
 * OpenAI, unsupported here) currently has it silently ignored, so the model may simply not call the
 * tool — a baffling failure that a 400 would have explained.
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

/** The model ids this endpoint advertises. Mirrors `advertisedModelIds()` in `llm_service.ts`. */
export const ADVERTISED_LLM_MODELS = ["mistral-large-latest"] as const;

// ── Request ──

export const LLMChatMessageSchema = z
  .looseObject({
    role: z.enum(["system", "user", "assistant"]).describe("The speaker's role."),
    content: z.string().describe("The message text."),
  })
  .describe("One turn of the conversation.");

export const LLMChatRequestSchema = z
  .looseObject({
    model: z
      .enum(ADVERTISED_LLM_MODELS)
      .describe(
        "The model to use. Only the advertised model id(s) are served; others return model_not_found.",
      ),
    messages: z.array(LLMChatMessageSchema).min(1).describe("The conversation so far."),
    stream: z
      .literal(false)
      .optional()
      .describe(
        "Streaming is not supported. Each message settles on its final token usage, which requires the whole completion, so stream:true is rejected rather than silently buffered.",
      ),
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
    "OpenAI chat-completions request body, plus this agent's vendor extensions. Unknown fields are ignored rather than rejected.",
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
