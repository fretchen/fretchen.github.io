/**
 * The image tool is confirm-then-act, and the whole sequence runs here with fake effects — no
 * rendering, no wallet, no card. What is left for `AssistantChat.test.tsx` is the wiring: that the
 * card really appears and that the real hooks are plugged into the right effects.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BaseError, UserRejectedRequestError } from "viem";
import {
  classifyImageError,
  parseImageArgs,
  runImageTool,
  type ImageSize,
  type ImageToolEffects,
} from "../tools/generateImage";
import { describeFailure, fetchFailed } from "../tools/failure";

/** Effects that succeed, so each test overrides only the one it is about. */
function effects(overrides: Partial<ImageToolEffects> = {}): ImageToolEffects {
  return {
    confirm: vi.fn(async (prompt: string, size: ImageSize) => ({ action: "confirm" as const, prompt, size })),
    ensureNetwork: vi.fn(async () => null),
    generate: vi.fn(async () => ({ imageUrl: "https://img/x.png", network: "eip155:10" })),
    onPhase: vi.fn(),
    ...overrides,
  };
}

describe("parseImageArgs", () => {
  it("defaults a missing prompt to the empty string, which the card lets the user fill in", () => {
    expect(parseImageArgs({}).prompt).toBe("");
    expect(parseImageArgs({ prompt: 42 }).prompt).toBe("");
  });

  it("accepts the wide size and falls back to square for anything else", () => {
    expect(parseImageArgs({ size: "1792x1024" }).size).toBe("1792x1024");
    expect(parseImageArgs({ size: "4096x4096" }).size).toBe("1024x1024");
    expect(parseImageArgs({}).size).toBe("1024x1024");
  });
});

describe("classifyImageError", () => {
  it("finds a rejected signature even when wagmi has wrapped it", () => {
    const wrapped = new BaseError("outer", { cause: new UserRejectedRequestError(new Error("nope")) });
    expect(classifyImageError(wrapped)).toBe("user_declined");
  });

  // Our own message from validatingFetch, so matching it is not brittle the way upstream text is.
  it("recognises the frontend's own network-mismatch message", () => {
    expect(classifyImageError(new Error("Network mismatch! expected 10"))).toBe("wrong_network");
  });

  it("folds everything else into generation_failed", () => {
    expect(classifyImageError(new Error("insufficient funds"))).toBe("generation_failed");
    expect(classifyImageError("a string")).toBe("generation_failed");
  });
});

describe("describeFailure", () => {
  it("collapses a multi-line error onto one line", () => {
    expect(describeFailure(new Error("first line\n\n  second line"))).toBe("first line second line");
  });

  // Tool results are input tokens on every later hop, so an unbounded wallet error is a
  // recurring charge rather than a one-off.
  it("truncates past 200 characters", () => {
    const reason = describeFailure(new Error("x".repeat(500)));
    expect(reason.length).toBe(201);
    expect(reason.endsWith("…")).toBe(true);
  });

  it("leaves a short message alone", () => {
    expect(describeFailure(new Error("HTTP 503"))).toBe("HTTP 503");
  });
});

describe("fetchFailed", () => {
  it("truncates through describeFailure, so the fetching tools get the same bound", () => {
    expect(fetchFailed(new Error("y".repeat(500)))).toEqual({
      status: "fetch_failed",
      reason: `${"y".repeat(200)}…`,
    });
  });
});

describe("runImageTool", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it("returns user_declined without generating when the card is cancelled", async () => {
    const fx = effects({ confirm: vi.fn(async () => ({ action: "cancel" as const })) });

    expect(await runImageTool({ prompt: "a cat" }, fx)).toEqual({ result: { status: "user_declined" } });
    expect(fx.generate).not.toHaveBeenCalled();
  });

  // The card's own values win: the user is free to rewrite the model's prompt before approving.
  it("generates with what the user confirmed, not with what the model proposed", async () => {
    const fx = effects({
      confirm: vi.fn(async () => ({ action: "confirm" as const, prompt: "a dog", size: "1792x1024" as const })),
    });

    await runImageTool({ prompt: "a cat", size: "1024x1024" }, fx);

    expect(fx.generate).toHaveBeenCalledWith("a dog", "1792x1024");
  });

  it("returns wrong_network with the reason and never pays", async () => {
    const fx = effects({ ensureNetwork: vi.fn(async () => "please switch to Optimism") });

    expect(await runImageTool({ prompt: "a cat" }, fx)).toEqual({
      result: { status: "wrong_network", reason: "please switch to Optimism" },
    });
    expect(fx.generate).not.toHaveBeenCalled();
  });

  it("omits the reason when the network switch failed without saying why", async () => {
    const fx = effects({ ensureNetwork: vi.fn(async () => "") });

    expect(await runImageTool({ prompt: "a cat" }, fx)).toEqual({ result: { status: "wrong_network" } });
  });

  // The URL goes back to the caller for rendering; the loop keeps it out of the conversation.
  it("reports the network the image was actually generated on, alongside the URL", async () => {
    const fx = effects({
      generate: vi.fn(async () => ({ imageUrl: "https://img/done.png", network: "eip155:8453" })),
    });

    expect(await runImageTool({ prompt: "a cat" }, fx)).toEqual({
      result: { status: "ok", network: "eip155:8453" },
      imageUrl: "https://img/done.png",
    });
  });

  it("classifies a thrown error and still hands the model the reason", async () => {
    const fx = effects({ generate: vi.fn(async () => Promise.reject(new Error("upstream 500"))) });

    expect(await runImageTool({ prompt: "a cat" }, fx)).toEqual({
      result: { status: "generation_failed", reason: "upstream 500" },
    });
    // Dropping the error entirely is how a real failure once became undebuggable.
    expect(consoleError).toHaveBeenCalled();
  });

  it("never throws, so the loop survives a rejected signature", async () => {
    const rejected = new BaseError("outer", { cause: new UserRejectedRequestError(new Error("nope")) });
    const fx = effects({ generate: vi.fn(async () => Promise.reject(rejected)) });

    const { result } = await runImageTool({ prompt: "a cat" }, fx);
    expect(result.status).toBe("user_declined");
  });

  it("announces the generating phase once, after confirmation and before paying", async () => {
    const fx = effects();
    await runImageTool({ prompt: "a cat" }, fx);

    expect(fx.onPhase).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fx.onPhase!).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(fx.generate).mock.invocationCallOrder[0],
    );
  });

  // The phase carries the confirmed values rather than the model's, because the card shows the
  // prompt while generating and the user may have rewritten it before approving.
  it("announces the phase with what the user confirmed, not what the model asked for", async () => {
    const fx = effects({
      confirm: vi.fn(async () => ({ action: "confirm" as const, prompt: "a dog", size: "1792x1024" as const })),
    });
    await runImageTool({ prompt: "a cat", size: "1024x1024" }, fx);

    expect(fx.onPhase).toHaveBeenCalledWith({ phase: "generating", prompt: "a dog", size: "1792x1024" });
  });

  it("does not announce a generating phase when the user cancels", async () => {
    const fx = effects({ confirm: vi.fn(async () => ({ action: "cancel" as const })) });
    await runImageTool({ prompt: "a cat" }, fx);

    expect(fx.onPhase).not.toHaveBeenCalled();
  });
});
