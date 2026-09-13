/**
 * Zod schemas for the responses of the third-party APIs this package calls.
 *
 * PRIVATE — never imported by `scripts/`, never published, unlike `genimg_schemas.ts` and
 * `llm_schemas.ts`. The separate file keeps that rule enforced by the import graph. All
 * `looseObject`: the provider owns its contract and adds fields whenever it likes.
 *
 * **`.optional()` is not enough.** It accepts a missing key but never a present-but-null one, and
 * real providers overwhelmingly send the latter. Every loosening below came from a production
 * failure rather than speculation, and three were this same mistake:
 *
 *   - BFL sends `result: null` on every poll before the job finishes — killed generation on poll
 *     1 of 60, on a job that was merely Pending.
 *   - Mistral sends `tool_calls: null` on an ordinary text turn — 500'd the third hop of a live
 *     conversation, after two tool calls had already run and been paid for.
 *   - Mistral sends `content` as an array of content parts rather than a string, on the turn
 *     right after a tool result. See `flattenUpstreamContent`.
 */

import { z } from "zod";

// ── Black Forest Labs (image generation) ──

/**
 * Both required: a missing `polling_url` becomes `fetch(undefined)` in the poll loop, is swallowed
 * as a transient blip, and fails five minutes later as a timeout naming the wrong cause.
 */
export const BflSubmitSchema = z.looseObject({
  id: z.string(),
  polling_url: z.url(),
});

/**
 * `status` is a free string because BFL owns that vocabulary — an unrecognized status must reach
 * the status checks rather than be rejected here.
 */
export const BflPollSchema = z.looseObject({
  status: z.string(),
  result: z.looseObject({ sample: z.string() }).nullable().optional(),
});

// ── OpenAI-compatible chat completions (Mistral) ──

/**
 * `getSettleAmount(usage)` in `sc_llm_x402.ts` runs after the try/catch around `callLLMAPI` has
 * closed, so a non-numeric `prompt_tokens` used to throw out of `handle()` as an unhandled
 * rejection. `total_tokens` is required because `LLMResponse["usage"]` requires it.
 */
export const UpstreamUsageSchema = z.looseObject({
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
});

/** One tool call the model wants made. `arguments` is a JSON *string*, per OpenAI. */
const UpstreamToolCallSchema = z.looseObject({
  id: z.string(),
  type: z.literal("function"),
  function: z.looseObject({ name: z.string(), arguments: z.string() }),
});

/** An OpenAI "content part". `text` is optional: a part may be an image, carrying no text. */
const UpstreamContentPartSchema = z.looseObject({
  type: z.string(),
  text: z.string().optional(),
});

const UpstreamContentSchema = z.union([z.string(), z.array(UpstreamContentPartSchema)]);

/**
 * Collapse either content form to the plain string our own envelope publishes. Flattened here
 * rather than republished as a union, which would be a breaking change to `LLMChatResponseSchema`
 * for an upstream quirk. Null when there is no text to show — the tool-call case.
 */
export function flattenUpstreamContent(content: unknown): string | null {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const text = content
      .map((part) => (part as { text?: unknown }).text)
      .filter((t): t is string => typeof t === "string")
      .join("");
    return text.length > 0 ? text : null;
  }
  return null;
}

/**
 * Not `LLMChatResponseSchema` — that describes what we return, with every field required. This
 * describes what we receive, so everything `callLLMAPI` synthesizes (`id`, `created`, `object`,
 * `index`, `role`, `finish_reason`) is optional.
 *
 * The refine tests `Array.isArray(m.tool_calls)` rather than `!== undefined`, because
 * `null !== undefined` is true and would let a genuinely empty `{content: null, tool_calls: null}`
 * completion through.
 */
export const UpstreamChatCompletionSchema = z.looseObject({
  id: z.string().optional(),
  created: z.number().optional(),
  model: z.string().optional(),
  choices: z
    .array(
      z.looseObject({
        index: z.number().int().optional(),
        message: z
          .looseObject({
            role: z.string().optional(),
            content: UpstreamContentSchema.nullable().optional(),
            tool_calls: z.array(UpstreamToolCallSchema).min(1).nullable().optional(),
          })
          .refine(
            (m) => flattenUpstreamContent(m.content) !== null || Array.isArray(m.tool_calls),
            { error: "message must carry either content or tool_calls" },
          ),
        finish_reason: z.string().nullable().optional(),
      }),
    )
    .min(1),
  usage: UpstreamUsageSchema,
});
