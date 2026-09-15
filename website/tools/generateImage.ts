import { BaseError, UserRejectedRequestError } from "viem";
import type { X402Tool } from "../types/x402";
import { describeFailure } from "./failure";

/**
 * The `generate_image` tool: definition, result vocabulary, and the sequence it runs.
 *
 * The third module shape in `tools/`. `bundestakt.ts` and `analytics.ts` are fetch-then-project;
 * this one is confirm-then-act, and `social_media_publication` will be the same. What only exists
 * inside React — the confirmation card, the network switch, the paid wallet call — arrives as
 * named effects rather than being imported, so the module itself stays React-free and the whole
 * sequence is testable without rendering anything.
 */

/** The sizes the backend offers. Also the enum the model sees, so the two cannot drift. */
export const IMAGE_SIZES = ["1024x1024", "1792x1024"] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

/**
 * OpenAI function-calling shape.
 *
 * Identical to the object `scw_js/notebooks/sc_llm_x402_buyer.ipynb` and
 * `scw_js/imagegen-in-chat-plan_1.md` §2 exercise against the real backend — the same payload
 * is proven there before it ships here.
 *
 * `network`, `model`, `n`, `response_format`, `isListed` and `mode`/`referenceImage` are
 * deliberately absent: none is a model decision. `network` in particular is filled by the
 * frontend from the connected wallet's chain, not the model — an omitted network is how a
 * testnet run would end up paying real money on genimg's `exact` scheme.
 */
export const generateImageTool: X402Tool = {
  type: "function",
  function: {
    name: "generate_image",
    description:
      "Generate an image from a text prompt. Call this as soon as the user has described the " +
      "image they want — do not ask them to confirm in chat first. Calling it shows the user a " +
      "confirmation card themselves (prompt, size, the $0.07 USDC cost, a wallet signature " +
      "prompt) before anything is generated or charged, so their approval is already handled by " +
      "the app, not by you. Only call it when the user has clearly asked for an image.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Detailed English image prompt" },
        size: { type: "string", enum: [...IMAGE_SIZES] },
      },
      required: ["prompt"],
    },
  },
};

// --- Result contract -------------------------------------------------------------------------
//
// Returned rather than thrown, so the tool loop keeps running and the model can explain a
// failure instead of the whole chat message crashing.

export type ImageToolResult =
  | { status: "ok"; network: string }
  // `reason` is optional on the two the user causes: declining at the card, or a network switch
  // that reported nothing. It is always set when an error was thrown.
  | { status: "user_declined"; reason?: string }
  | { status: "wrong_network"; reason?: string }
  | { status: "generation_failed"; reason: string };

// --- Pure pieces -----------------------------------------------------------------------------

/**
 * Normalises the model's arguments. Neither field is trusted: `parseToolArgs` has already turned
 * malformed JSON into `{}`, and an empty prompt is fine here because the confirmation card lets
 * the user type one before approving.
 */
export function parseImageArgs(args: Record<string, unknown>): { prompt: string; size: ImageSize } {
  return {
    prompt: typeof args.prompt === "string" ? args.prompt : "",
    size: args.size === "1792x1024" ? "1792x1024" : "1024x1024",
  };
}

/**
 * Classify a thrown generation error into what the model needs to react sensibly, without
 * string-matching upstream/provider error text. Two cases are reliably detectable: a rejected
 * wallet signature (a typed viem error, found via `.walk()` since wagmi commonly wraps it) and
 * the frontend's own `validatingFetch` network-mismatch message (ours, not upstream, so matching
 * it is not brittle). Everything else — insufficient balance, API failures, timeouts — folds into
 * `generation_failed`; there is no reliable, non-string-matched way to split those further.
 */
export function classifyImageError(err: unknown): "user_declined" | "wrong_network" | "generation_failed" {
  if (err instanceof BaseError && err.walk((e) => e instanceof UserRejectedRequestError)) {
    return "user_declined";
  }
  const message = err instanceof Error ? err.message : String(err);
  if (message.startsWith("Network mismatch!")) return "wrong_network";
  return "generation_failed";
}

// --- The sequence ----------------------------------------------------------------------------

/** What this tool needs that only exists inside the React app. Named per effect rather than
 *  bundled into a shared `ctx`: another tool needs different things, not more of these. */
export interface ImageToolEffects {
  /** Shows the confirmation card and resolves only once the user has decided. */
  confirm: (
    prompt: string,
    size: ImageSize,
  ) => Promise<{ action: "confirm"; prompt: string; size: ImageSize } | { action: "cancel" }>;
  /** Switches to the image network. `null` means ready; anything else is the reason it is not. */
  ensureNetwork: () => Promise<string | null>;
  /** The actual paid call. Throws — `classifyImageError` sorts out what the throw meant. */
  generate: (prompt: string, size: ImageSize) => Promise<{ imageUrl: string; network: string }>;
  /** What the user should be looking at while this runs. Carries the *confirmed* prompt and size,
   *  not the model's — the user is free to rewrite both at the card. `null` means nothing. */
  onPhase?: (phase: { phase: "generating"; prompt: string; size: ImageSize } | null) => void;
}

/**
 * Runs the image tool end to end: pause for the user's confirmation, generate the image, and
 * return the compact `{status}` result the model gets back plus the image URL for local
 * rendering. Never throws — every failure path resolves to a status the model can react to.
 */
export async function runImageTool(
  args: Record<string, unknown>,
  fx: ImageToolEffects,
): Promise<{ result: ImageToolResult; imageUrl?: string }> {
  const initial = parseImageArgs(args);

  const resolution = await fx.confirm(initial.prompt, initial.size);
  if (resolution.action === "cancel") {
    return { result: { status: "user_declined" } };
  }

  fx.onPhase?.({ phase: "generating", prompt: resolution.prompt, size: resolution.size });

  const networkProblem = await fx.ensureNetwork();
  if (networkProblem !== null) {
    return { result: { status: "wrong_network", reason: networkProblem || undefined } };
  }

  try {
    const image = await fx.generate(resolution.prompt, resolution.size);
    return { result: { status: "ok", network: image.network }, imageUrl: image.imageUrl };
  } catch (err) {
    // Both the log and the `reason` exist because the first version of this catch classified the
    // error into a one-word status and dropped the error itself. A real failure then produced no
    // console output at all and told the model only "generation_failed", so the user got "I'm
    // having trouble generating the image" with no way — for them or for us — to find out why.
    console.error("generate_image tool call failed:", err);
    return { result: { status: classifyImageError(err), reason: describeFailure(err) } };
  }
}
