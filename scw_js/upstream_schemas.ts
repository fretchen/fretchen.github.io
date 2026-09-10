/**
 * Zod schemas for the responses of the third-party APIs this package calls out to.
 *
 * **PRIVATE — never imported by `scripts/`, never published.** These describe *their* wire format,
 * not ours. `genimg_schemas.ts` and `llm_schemas.ts` are the opposite: published UI, rendered on
 * the website by `SpecParamTable`, with load-bearing export names. Keeping the two kinds in
 * separate files makes that rule enforceable by the import graph — the spec generators import only
 * the published schema files, so nothing here can leak into `components.schemas`.
 *
 * Everything here is `looseObject` and models only the fields we actually read. The provider owns
 * its contract and adds fields whenever it likes; rejecting a response for carrying a field we did
 * not anticipate would be strictly worse than the bare casts these replace.
 *
 * What they buy is a clean, immediate failure at the boundary instead of a `TypeError` several
 * frames later. Both endpoints verify payment *before* the upstream call and settle *after* it
 * (genimg: verify at `genimg_x402_token.ts` → generate → settle; llm: verify → `callLLMAPI` →
 * settle), so a malformed upstream response costs the caller nothing — but the old failure modes
 * were expensive to operate: a missing `polling_url` became `fetch(undefined)` and was retried for
 * five minutes before surfacing as a *timeout*, and a non-numeric `usage` escaped the handler
 * entirely as an unhandled rejection.
 */

import { z } from "zod";

// ── Black Forest Labs (image generation) ──

/**
 * BFL's response to the initial generation request.
 *
 * Both fields are required, and this is the one place in this file that fails fast: `polling_url`
 * is fed straight to `fetch()`, so `undefined` there does not fail where it is produced. It
 * becomes `fetch(undefined)` inside the poll loop's transport `try`, gets swallowed as a transient
 * blip, and is retried 60 times at 5s intervals — the request then fails five minutes later with a
 * timeout message that names the wrong cause.
 */
export const BflSubmitSchema = z.looseObject({
  id: z.string(),
  polling_url: z.url(),
});

/**
 * BFL's poll response.
 *
 * `status` is a free string, not an enum: BFL owns that vocabulary (`Pending`, `Ready`, `Error`,
 * `Failed`, and whatever it adds next), and an unrecognized status must reach the status checks
 * rather than being rejected here. `result` is optional because a `Failed` poll legitimately has
 * none — the `Ready`-without-`result` case is checked at the use site, where it can throw a
 * message that says what actually happened.
 *
 * So this rejects exactly one thing: a body that is not a BFL poll response at all.
 */
export const BflPollSchema = z.looseObject({
  status: z.string(),
  result: z.looseObject({ sample: z.string() }).optional(),
});

// ── OpenAI-compatible chat completions (Mistral) ──

/**
 * Token usage from the upstream model.
 *
 * This is the load-bearing one. `getSettleAmount(llmData.usage)` in `sc_llm_x402.ts` runs *after*
 * the try/catch around `callLLMAPI` has closed, so a non-numeric `prompt_tokens` reaches
 * `parseTokenCount`, throws a `TypeError`, and escapes `handle()` as an unhandled rejection —
 * no response body, no CORS headers, no log line we own. Validating here turns that into a 500.
 *
 * `total_tokens` is required rather than derived: `LLMResponse["usage"]` requires it, and the
 * value is the upstream's own accounting, not ours to reconstruct.
 */
export const UpstreamUsageSchema = z.looseObject({
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
});

/**
 * An OpenAI-compatible chat-completion response.
 *
 * Deliberately **not** `LLMChatResponseSchema` from `llm_schemas.ts`. That one describes what *we*
 * return and has every field required; this describes what we *receive*, and real providers omit
 * plenty of it. Everything `callLLMAPI` synthesizes downstream — `id`, `created`, `object`,
 * `choices[].index`, `message.role`, `finish_reason` — is optional here, because the synthesis is
 * the point: we normalize a partial upstream envelope into a complete one.
 *
 * Required is only what we cannot proceed without: at least one choice with string content, and a
 * numeric `usage` to price the settlement from.
 */
export const UpstreamChatCompletionSchema = z.looseObject({
  id: z.string().optional(),
  created: z.number().optional(),
  model: z.string().optional(),
  choices: z
    .array(
      z.looseObject({
        index: z.number().int().optional(),
        message: z.looseObject({
          role: z.string().optional(),
          content: z.string(),
        }),
        finish_reason: z.string().nullable().optional(),
      }),
    )
    .min(1),
  usage: UpstreamUsageSchema,
});
