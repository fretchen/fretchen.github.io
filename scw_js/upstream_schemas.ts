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
 * the status checks rather than be rejected here. `result` is optional because a `Failed` poll has
 * none; the `Ready`-without-`result` case is checked at the use site.
 */
export const BflPollSchema = z.looseObject({
  status: z.string(),
  result: z.looseObject({ sample: z.string() }).optional(),
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
 * Not `LLMChatResponseSchema` — that describes what we return, with every field required. This
 * describes what we receive, so everything `callLLMAPI` synthesizes (`id`, `created`, `object`,
 * `index`, `role`, `finish_reason`) is optional.
 *
 * `content` is nullable because a tool-call turn has none. The refine keeps the check that
 * loosening it would otherwise throw away: a message must carry content *or* tool calls, so a
 * genuinely empty completion is still rejected rather than billed for. Refines are invisible to
 * `z.toJSONSchema`, which is free here — this file is never published.
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
            content: z.string().nullable().optional(),
            tool_calls: z.array(UpstreamToolCallSchema).min(1).optional(),
          })
          .refine((m) => typeof m.content === "string" || m.tool_calls !== undefined, {
            error: "message must carry either content or tool_calls",
          }),
        finish_reason: z.string().nullable().optional(),
      }),
    )
    .min(1),
  usage: UpstreamUsageSchema,
});
