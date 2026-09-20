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

/**
 * Paid tool calls allowed in one turn.
 *
 * `MAX_HOPS` bounds hops, not calls — a single hop may ask for as many tools as it likes, so one
 * question could fan out into a dozen searches before anyone noticed. At $0.01 a search this caps
 * a turn's tool spend at about six cents, and it behaves like a failed tool rather than an error:
 * the paid tools come off the menu and the model answers with what it already has.
 */
export const MAX_PAID_CALLS = 6;

/** What running one tool produces: the compact `{status}` object the model gets back, plus two
 *  fields the loop reads and the model never sees — the image URL the chat renders locally, and
 *  whether a non-`ok` result still leaves the tool worth offering. */
export type ToolRunResult = {
  result: { status: string; [key: string]: unknown };
  /** Set by `generate_image`. Display only; never serialized into the conversation. */
  imageUrl?: string;
  /** Set when a non-`ok` result means the tool itself is healthy and the model can usefully retry
   *  with corrected arguments — a runner's own judgement, because only it knows which of its
   *  statuses are answers rather than malfunctions. Loop-only, like `imageUrl`. */
  recoverable?: boolean;
};

/** A tool on offer for this turn, with the citation it obliges. Owner scope and the user's own
 *  selection are applied by the caller — what arrives here is already what may be offered. */
export interface OfferedTool<S extends string> {
  tool: X402Tool;
  source: S | null;
  /** Costs the user USDC per call, so it counts against `MAX_PAID_CALLS`. */
  paid?: boolean;
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
  const isPaid = new Set(offeredTools.filter((entry) => entry.paid).map((entry) => entry.tool.function.name));
  let paidCalls = 0;

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
      // Budget spent: the paid tools come off the menu, the free ones stay. Withdrawing rather
      // than refusing is what lets the model close with what it has.
      .filter((entry) => !entry.paid || paidCalls < MAX_PAID_CALLS)
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

    // Serial, and it has to stay that way: the paid tools spend vouchers on ONE payment channel,
    // and the server holds a per-channel lock from verify to settle, so two in flight is
    // `channel_busy` by construction. `Promise.all` here would overlap the round-trips and break
    // exactly that.
    for (const call of toolCalls) {
      if (isPaid.has(call.function.name)) {
        // The cap has to bite here and not only on the next hop's menu: one hop can ask for a
        // dozen searches, and the menu filter above runs after every one of them has been paid
        // for. Answered rather than skipped, because every tool_call needs a matching result or
        // the next request is malformed.
        if (paidCalls >= MAX_PAID_CALLS) {
          failedTools.add(call.function.name);
          convo.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify({
              status: "budget_exhausted",
              reason: "This turn's budget for paid tools is used up. Answer with what you already have.",
            }),
          });
          continue;
        }
        paidCalls++;
      }
      const { result, imageUrl, recoverable } = await runToolCall(call);
      if (imageUrl) finalImageUrl = imageUrl;
      // Only a real failure withdraws the tool for the rest of the turn. Which non-`ok` statuses
      // are merely answers is the runner's call, not this file's — see `recoverable`.
      const source = sourceOf.get(call.function.name);
      if (result.status !== "ok" && !recoverable) {
        failedTools.add(call.function.name);
      } else if (result.status === "ok" && source) {
        usedSources.add(source);
      }
      convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  return { finalContent, finalImageUrl, sources: [...usedSources] };
}
