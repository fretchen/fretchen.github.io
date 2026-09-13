/**
 * Zod schemas for the responses of the third-party APIs this package calls.
 *
 * PRIVATE — never imported by `scripts/`, never published. `genimg_schemas.ts` and
 * `llm_schemas.ts` are the opposite: published UI with load-bearing export names. The separate
 * file keeps that rule enforced by the import graph.
 *
 * All `looseObject`, modelling only the fields we read: the provider owns its contract and adds
 * fields whenever it likes.
 */

import { z } from "zod";

// ── Black Forest Labs (image generation) ──

/**
 * `polling_url` is fed straight to `fetch()`, so a missing one does not fail where it is produced
 * — it becomes `fetch(undefined)` in the poll loop, is swallowed as a transient blip, and fails
 * five minutes later as a timeout naming the wrong cause. Hence both fields required.
 */
export const BflSubmitSchema = z.looseObject({
  id: z.string(),
  polling_url: z.url(),
});

/**
 * `status` is a free string because BFL owns that vocabulary — an unrecognized status must reach
 * the status checks rather than be rejected here.
 *
 * `result` is nullable *and* optional: BFL sends `result: null` on every poll before the job
 * finishes, and `.optional()` alone rejects an explicit null. That killed generation on poll 1 of
 * 60 — the job was merely Pending. Same mistake as `tool_calls` below; `.optional()` covers a
 * missing key, never a present-but-null one, and real providers overwhelmingly send the latter.
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

/**
 * An OpenAI "content part". Mistral returns `content` as an array of these rather than a plain
 * string on some turns — observed on the turn right after a tool result. `text` is optional
 * because a part can be another kind (an image, say) that carries no text at all.
 */
const UpstreamContentPartSchema = z.looseObject({
  type: z.string(),
  text: z.string().optional(),
});

/** Either wire form of an assistant message's content. `flattenUpstreamContent` normalizes it. */
const UpstreamContentSchema = z.union([z.string(), z.array(UpstreamContentPartSchema)]);

/**
 * Collapse either content form to the plain string our own envelope publishes.
 *
 * Our `LLMChatResponseSchema` says `content: string | null`, and callers (the website's chat
 * bubble, any llm/v1 consumer) read exactly that — so the parts array is flattened here rather
 * than republished, which would be a breaking contract change for an upstream quirk. Returns
 * null when there is no text to show, which is the tool-call case.
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
 * Every field here has been loosened in response to a real failure, never speculatively, and all
 * three were the same mistake: assuming a provider omits a field it actually sends as `null`, or
 * sends one shape where it may send two.
 *
 *   - `tool_calls: null` on an ordinary text turn (not omitted) — 500'd the third hop of a live
 *     tool-calling conversation, after two tool calls had already run and been paid for.
 *   - `content` as an **array of content parts** rather than a string — observed on the turn
 *     right after a tool result. See `flattenUpstreamContent`.
 *   - `content: null` on a tool-call turn, which has no text at all.
 *
 * The refine tests `Array.isArray(m.tool_calls)` rather than `!== undefined` because
 * `null !== undefined` is true, which would let a genuinely empty `{content: null,
 * tool_calls: null}` completion through. Refines are invisible to `z.toJSONSchema`, which costs
 * nothing here — this file is never published.
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
