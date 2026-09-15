/**
 * The loop is a plain function, so these are plain tests — no rendering, no wallet, no cards.
 * What is covered here is the turn mechanics that AssistantChat.test.tsx can only reach through
 * the UI: hop exhaustion, which tools stay on offer, and what counts as a contributing source.
 */
import { describe, it, expect, vi } from "vitest";
import { runToolLoop, MAX_HOPS, type OfferedTool } from "../utils/toolLoop";
import type { X402ChatMessage, X402Tool } from "../types/x402";

type Source = "alpha" | "beta";

function tool(name: string): X402Tool {
  return { type: "function", function: { name, description: name, parameters: { type: "object", properties: {} } } };
}

const OFFERED: OfferedTool<Source>[] = [
  { tool: tool("alpha_tool"), source: "alpha" },
  { tool: tool("beta_tool"), source: "beta" },
  { tool: tool("plain_tool"), source: null },
];

function toolCallTurn(name: string) {
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [{ id: `call_${name}`, type: "function", function: { name, arguments: "{}" } }],
        },
        finish_reason: "tool_calls",
      },
    ],
  };
}

function textTurn(content: string) {
  return { choices: [{ message: { role: "assistant", content }, finish_reason: "stop" }] };
}

/** Names offered on the nth payAndSend call. */
function offeredOn(payAndSend: ReturnType<typeof vi.fn>, call: number): string[] | undefined {
  const options = payAndSend.mock.calls[call][1] as { tools?: X402Tool[] };
  return options.tools?.map((t) => t.function.name);
}

function convo(): X402ChatMessage[] {
  return [{ role: "user", content: "go" }];
}

describe("runToolLoop", () => {
  const deps = (payAndSend: unknown, runToolCall: unknown) => ({
    ensureReady: vi.fn().mockResolvedValue(undefined),
    payAndSend: payAndSend as never,
    runToolCall: runToolCall as never,
  });

  it("returns the model's closing text and stops", async () => {
    const payAndSend = vi.fn().mockResolvedValue(textTurn("done"));
    const runToolCall = vi.fn();

    const result = await runToolLoop<Source>(convo(), OFFERED, deps(payAndSend, runToolCall));

    expect(result.finalContent).toBe("done");
    expect(payAndSend).toHaveBeenCalledOnce();
    expect(runToolCall).not.toHaveBeenCalled();
  });

  // The caller decides the wording, so "nothing usable" must come back as null rather than as a
  // locale string the loop would have to know.
  it("reports empty or whitespace-only content as null", async () => {
    for (const content of ["", "   "]) {
      const payAndSend = vi.fn().mockResolvedValue(textTurn(content));
      const result = await runToolLoop<Source>(convo(), OFFERED, deps(payAndSend, vi.fn()));
      expect(result.finalContent).toBeNull();
    }
  });

  it("gives up after MAX_HOPS when the model never answers", async () => {
    const payAndSend = vi.fn().mockResolvedValue(toolCallTurn("plain_tool"));
    const runToolCall = vi.fn().mockResolvedValue({ result: { status: "ok" } });

    const result = await runToolLoop<Source>(convo(), OFFERED, deps(payAndSend, runToolCall));

    expect(payAndSend).toHaveBeenCalledTimes(MAX_HOPS);
    expect(result.finalContent).toBeNull();
  });

  it("feeds each tool result back as a role:'tool' turn", async () => {
    const payAndSend = vi.fn().mockResolvedValueOnce(toolCallTurn("alpha_tool")).mockResolvedValueOnce(textTurn("ok"));
    const runToolCall = vi.fn().mockResolvedValue({ result: { status: "ok", value: 42 } });
    const messages = convo();

    await runToolLoop<Source>(messages, OFFERED, deps(payAndSend, runToolCall));

    const toolTurn = messages.find((m) => m.role === "tool");
    expect(toolTurn).toBeDefined();
    expect(JSON.parse(toolTurn!.content as string)).toEqual({ status: "ok", value: 42 });
  });

  it("withdraws a failed tool from later hops, leaving the others", async () => {
    const payAndSend = vi
      .fn()
      .mockResolvedValueOnce(toolCallTurn("alpha_tool"))
      .mockResolvedValueOnce(textTurn("that failed"));
    const runToolCall = vi.fn().mockResolvedValue({ result: { status: "fetch_failed", reason: "down" } });

    await runToolLoop<Source>(convo(), OFFERED, deps(payAndSend, runToolCall));

    expect(offeredOn(payAndSend, 0)).toContain("alpha_tool");
    expect(offeredOn(payAndSend, 1)).not.toContain("alpha_tool");
    expect(offeredOn(payAndSend, 1)).toEqual(expect.arrayContaining(["beta_tool", "plain_tool"]));
  });

  // `not_found` is a normal outcome of the list-then-detail pattern, not a broken tool — the model
  // has to be able to retry with a corrected argument.
  it("keeps a tool on offer after not_found", async () => {
    const payAndSend = vi.fn().mockResolvedValueOnce(toolCallTurn("alpha_tool")).mockResolvedValueOnce(textTurn("ok"));
    const runToolCall = vi.fn().mockResolvedValue({ result: { status: "not_found" } });

    await runToolLoop<Source>(convo(), OFFERED, deps(payAndSend, runToolCall));

    expect(offeredOn(payAndSend, 1)).toContain("alpha_tool");
  });

  // `[]` is truthy and would be sent as an empty tools array; "nothing left" has to omit the key.
  it("omits the tools key once every tool has failed", async () => {
    const payAndSend = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: OFFERED.map((entry, i) => ({
              id: `c${i}`,
              type: "function",
              function: { name: entry.tool.function.name, arguments: "{}" },
            })),
          },
          finish_reason: "tool_calls",
        },
      ],
    });
    const runToolCall = vi.fn().mockResolvedValue({ result: { status: "fetch_failed", reason: "x" } });

    await runToolLoop<Source>(convo(), OFFERED, deps(payAndSend, runToolCall));

    expect(offeredOn(payAndSend, 1)).toBeUndefined();
  });

  describe("sources", () => {
    async function runWith(status: string, name = "alpha_tool") {
      const payAndSend = vi.fn().mockResolvedValueOnce(toolCallTurn(name)).mockResolvedValueOnce(textTurn("ok"));
      const runToolCall = vi.fn().mockResolvedValue({ result: { status } });
      return runToolLoop<Source>(convo(), OFFERED, deps(payAndSend, runToolCall));
    }

    it("credits a source only when its tool succeeded", async () => {
      expect((await runWith("ok")).sources).toEqual(["alpha"]);
    });

    it("credits nothing when the tool failed", async () => {
      expect((await runWith("fetch_failed")).sources).toEqual([]);
    });

    it("credits nothing when the tool has no source to cite", async () => {
      expect((await runWith("ok", "plain_tool")).sources).toEqual([]);
    });
  });

  it("passes an image URL through without letting it reach the model", async () => {
    const payAndSend = vi.fn().mockResolvedValueOnce(toolCallTurn("plain_tool")).mockResolvedValueOnce(textTurn("ok"));
    const runToolCall = vi.fn().mockResolvedValue({ result: { status: "ok" }, imageUrl: "https://x/y.png" });
    const messages = convo();

    const result = await runToolLoop<Source>(messages, OFFERED, deps(payAndSend, runToolCall));

    expect(result.finalImageUrl).toBe("https://x/y.png");
    expect(JSON.stringify(messages)).not.toContain("https://x/y.png");
  });

  it("checks readiness before every hop, and lets a refusal abort the turn", async () => {
    const ensureReady = vi.fn().mockRejectedValue(new Error("wrong network"));
    const payAndSend = vi.fn();

    await expect(
      runToolLoop<Source>(convo(), OFFERED, { ensureReady, payAndSend: payAndSend as never, runToolCall: vi.fn() }),
    ).rejects.toThrow("wrong network");
    expect(payAndSend).not.toHaveBeenCalled();
  });
});
