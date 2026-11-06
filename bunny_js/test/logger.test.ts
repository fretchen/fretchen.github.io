import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { flushLogs, logger, withLogFlush } from "../src/logger.js";

// The flush mechanics only — no network. fetch is stubbed per test; env vars are set/cleared
// so a test can exercise both ends deliberately (hermetic even on a machine whose shell
// happens to export COCKPIT_* variables).
const realFetch = globalThis.fetch;
const mockFetch = vi.fn();

const TEST_URL = "https://logs.example.invalid/loki/api/v1/push";

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, status: 204 });
  globalThis.fetch = mockFetch as unknown as typeof fetch;
  process.env.COCKPIT_LOKI_URL = TEST_URL;
  process.env.SCW_COCKPIT_PUSH_TOKEN = "test-token";
});

afterEach(async () => {
  globalThis.fetch = realFetch;
  delete process.env.COCKPIT_LOKI_URL;
  delete process.env.SCW_COCKPIT_PUSH_TOKEN;
  // Drain whatever a test left behind, with the real fetch restored and no config: a no-op.
  await flushLogs();
});

function singlePushBody() {
  expect(mockFetch).toHaveBeenCalledTimes(1);
  const [calledUrl, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  expect(calledUrl).toBe(TEST_URL);
  return {
    init,
    body: JSON.parse(init.body as string),
  };
}

describe("flushLogs", () => {
  test("batches one Loki push per flush, X-Token-authenticated, with the fields the alert side keys on", async () => {
    logger.error({ err: "boom" }, "Request handler error");
    logger.error({ err: "boom2" }, "Paid request handler error");
    await flushLogs();

    const { init, body } = singlePushBody();
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Token"]).toBe("test-token");
    expect(headers["Content-Type"]).toBe("application/json");

    // One stream for the two error lines; the alert rule keys on exactly these labels.
    expect(body.streams).toHaveLength(1);
    const stream = body.streams[0];
    expect(stream.stream).toEqual({ service: "bunny-js", level: "error" });
    expect(stream.values).toHaveLength(2);
    expect(JSON.parse(stream.values[0][1])).toEqual({
      message: "Request handler error",
      err: "boom",
    });
    expect(JSON.parse(stream.values[1][1])).toEqual({
      message: "Paid request handler error",
      err: "boom2",
    });

    // pino-shaped string call: the string IS the message.
    mockFetch.mockClear();
    logger.warn("brave timeout");
    await flushLogs();
    const second = singlePushBody().body.streams[0];
    expect(second.stream.level).toBe("warn");
    expect(JSON.parse(second.values[0][1])).toEqual({ message: "brave timeout" });
  });

  test("same-millisecond lines get strictly increasing nanosecond timestamps as strings", async () => {
    logger.error({ attempt: 1 }, "same ms");
    logger.error({ attempt: 2 }, "same ms");
    logger.error({ attempt: 3 }, "same ms");
    await flushLogs();

    const { body } = singlePushBody();
    const [ts1, ts2, ts3] = body.streams[0].values.map(([ts]: [string]) => ts);
    expect(ts1).toMatch(/^\d{19}$/); // nanoseconds, not the ms Date.now() would give
    expect(BigInt(ts2)).toBeGreaterThan(BigInt(ts1));
    expect(BigInt(ts3)).toBeGreaterThan(BigInt(ts2));
  });

  test("levels split into separate streams; labels stay {service, level} only", async () => {
    logger.info("quiet");
    logger.warn("caller's fault");
    logger.error("ours");
    await flushLogs();

    const { body } = singlePushBody();
    expect(body.streams).toHaveLength(3);
    const byLevel = new Map<string, { level: string }>(
      body.streams.map((s: { stream: { level: string } }) => [s.stream.level, s.stream] as const),
    );
    expect([...byLevel.keys()].sort()).toEqual(["error", "info", "warn"]);
    for (const labels of byLevel.values()) {
      expect(Object.keys(labels).sort()).toEqual(["level", "service"]);
    }
  });

  test("empty buffer sends no fetch at all (the happy-path request stays free)", async () => {
    logger.error("seen");
    await flushLogs();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    mockFetch.mockClear();

    await flushLogs();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("a rejected fetch never throws out of flushLogs, and surfaces in the console", async () => {
    mockFetch.mockRejectedValue(new Error("network gone"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error({ err: "x" }, "Request handler error");
    try {
      await expect(flushLogs()).resolves.toBeUndefined();
      // mockRestore would reset the spy's history — assert while the spy still records.
      expect(
        consoleError.mock.calls.filter((c) => /log flush failed/.test(String(c[0]))),
      ).toHaveLength(1);
    } finally {
      consoleError.mockRestore();
    }
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("a non-2xx push is reported, and an ingest outage never throws", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error({ err: "x" }, "Request handler error");
    let flushFailureLine: unknown;
    try {
      await expect(flushLogs()).resolves.toBeUndefined();
      const failure = consoleError.mock.calls
        .map((c) => c[0])
        .find((l) => /log flush failed/.test(String(l)));
      expect(failure).toBeDefined();
      flushFailureLine = failure;
    } finally {
      consoleError.mockRestore();
    }
    expect(JSON.parse(flushFailureLine as string)).toMatchObject({
      msg: "log flush failed",
      status: 401,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("withLogFlush", () => {
  test("flushes when the handler returns early — the wrapper, not per-return call sites", async () => {
    const handler = vi.fn(async () => {
      logger.error({ path: "/nope" }, "Route not found");
      return new Response("404", { status: 404 });
    });
    const wrapped = withLogFlush("bunny-web-agent", handler);
    const res = await wrapped(new Request("https://x.example/nope"));
    expect(res.status).toBe(404);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // The per-script service label from the wrapper reaches the stream labels.
    const { body } = singlePushBody();
    expect(body.streams[0].stream).toEqual(expect.objectContaining({ service: "bunny-web-agent" }));
  });

  test("flushes even when the handler throws — and does not swallow the error", async () => {
    const handler = vi.fn(async () => {
      logger.error({ err: "uncaught" }, "Request handler error");
      throw new Error("handler blew up");
    });
    const wrapped = withLogFlush("bunny-mcp-agent", handler);
    await expect(wrapped(new Request("https://x.example/"))).rejects.toThrow("handler blew up");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const { body } = singlePushBody();
    expect(body.streams[0].stream).toEqual(expect.objectContaining({ service: "bunny-mcp-agent" }));
  });
});
