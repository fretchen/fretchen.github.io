import type { X402ChatMessage, X402ChatResponse, X402Tool, X402ToolCall } from "../types/x402";

/**
 * The assistant's tool loop, lifted out of `AssistantChat` so the component is left with state and
 * rendering.
 *
 * A plain function rather than a hook: it uses no React at all. Everything it needs — paying,
 * running a tool, checking the wallet is ready — arrives as a parameter, which also makes it
 * testable without rendering anything. The confirm card reaches it only as a closure inside a
 * runner; this file knows nothing about cards, messages or locale strings.
 */

/** Hops in one turn before giving up. Each hop is a separately metered chat message, so this
 *  bounds worst-case cost per user turn as well as stopping a model that never answers.
 *
 *  4 rather than 3: the Bundestakt flow is list -> detail -> answer, which already fills three, so
 *  a combined question (find the session, read it, then check a claim) needs one more. */
export const MAX_HOPS = 4;

/** What running one tool produces: the compact `{status}` object the model gets back, plus — for
 *  `generate_image` — the URL the chat renders locally. `imageUrl` never reaches the model. */
export type ToolRunResult = { result: { status: string; [key: string]: unknown }; imageUrl?: string };

/** A tool on offer for this turn, with the citation it obliges. Owner scope and the user's own
 *  selection are applied by the caller — what arrives here is already what may be offered. */
export interface OfferedTool<S extends string> {
  tool: X402Tool;
  source: S | null;
}

export interface ToolTurnResult<S extends string> {
  /** The model's closing text, or null when it produced none — the caller decides what to show
   *  instead, because that wording is a locale string and does not belong in here. */
  finalContent: string | null;
  /** Set when a tool produced an image this turn. Display only. */
  finalImageUrl?: string;
  /** Sources that actually contributed, for the citation line. Only successful calls count. */
  sources: S[];
}

export interface ToolLoopDeps {
  /** Called once per hop before paying. Throws if the wallet cannot proceed — the message is the
   *  caller's, so chain names and translations stay out of this file. */
  ensureReady: () => Promise<void>;
  payAndSend: (convo: X402ChatMessage[], options: { tools?: X402Tool[] }) => Promise<X402ChatResponse>;
  runToolCall: (call: X402ToolCall) => Promise<ToolRunResult>;
  maxHops?: number;
}

/**
 * Runs one user turn to completion: pay, let the model call tools, feed the results back, repeat
 * until it answers or the hops run out.
 *
 * `convo` is mutated as the turn proceeds (assistant tool-call turns and their `role: "tool"`
 * results are appended), which is what the next hop sends. The caller keeps that array local to
 * one turn so a past tool call is never replayed on a later message.
 */
export async function runToolLoop<S extends string>(
  convo: X402ChatMessage[],
  offeredTools: readonly OfferedTool<S>[],
  deps: ToolLoopDeps,
): Promise<ToolTurnResult<S>> {
  const { ensureReady, payAndSend, runToolCall, maxHops = MAX_HOPS } = deps;

  let finalContent: string | null = null;
  let finalImageUrl: string | undefined;
  const usedSources = new Set<S>();
  // Per tool, not global: a failed Bundestakt lookup must not also disable generate_image for the
  // rest of the turn. A failed tool is simply no longer offered on later hops.
  const failedTools = new Set<string>();
  const sourceOf = new Map(offeredTools.map((entry) => [entry.tool.function.name, entry.source]));

  for (let hop = 0; hop < maxHops; hop++) {
    // Re-checked every hop, not just the first: a mid-loop deposit or top-up could in principle
    // need the wallet on a particular chain.
    await ensureReady();

    // After a failed tool call the model is told what went wrong and given one turn to say so —
    // but NOT another chance to call the same failing tool. Left on offer it just retries: a real
    // conversation burned all three hops re-requesting an image that kept failing, so the user
    // approved three wallet prompts, paid for three attempts, and got the generic "no response"
    // fallback because no hop ever produced text.
    const offered = offeredTools
      .filter((entry) => !failedTools.has(entry.tool.function.name))
      .map((entry) => entry.tool);

    const data = await payAndSend(convo, {
      // `[]` is truthy, and useX402Chat spreads `tools` in on truthiness — an empty array would be
      // sent as `tools: []`. `undefined` drops the key (and tool_choice with it), which is what
      // "nothing left to offer" means on the wire.
      tools: offered.length > 0 ? offered : undefined,
    });

    const choice = data.choices?.[0];
    const toolCalls = choice?.message.tool_calls;

    if (choice?.finish_reason !== "tool_calls" || !toolCalls?.length) {
      // Mistral can return content: "" (or whitespace) with finish_reason: "stop" — a real,
      // empty-but-not-nullish completion, which `??` alone would let through as a blank bubble.
      const content = choice?.message.content;
      finalContent = content && content.trim().length > 0 ? content : null;
      break;
    }

    convo.push(choice.message); // the assistant turn, content: null, tool_calls intact

    for (const call of toolCalls) {
      const { result, imageUrl } = await runToolCall(call);
      if (imageUrl) finalImageUrl = imageUrl;
      // `not_found` (an unrecognized slug) is a normal, recoverable outcome — the whole point of
      // the list-then-detail pattern in the system prompt is that the model can retry with a
      // corrected slug. Only a real failure withdraws the tool for the rest of the turn.
      const source = sourceOf.get(call.function.name);
      if (result.status !== "ok" && result.status !== "not_found") {
        failedTools.add(call.function.name);
      } else if (result.status === "ok" && source) {
        usedSources.add(source);
      }
      convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  return { finalContent, finalImageUrl, sources: [...usedSources] };
}
