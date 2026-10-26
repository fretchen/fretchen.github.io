/**
 * The logger's RPC-URL redaction: a configured `RPC_URL_*` embeds a provider API key, and
 * viem's RPC errors print the configured endpoint verbatim into `message`/`stack` — the
 * `err` serializer must scrub exactly those strings (see logger.ts) before they reach
 * Loki and the alert emails that quote log lines. Unrelated URLs are untouched, and a
 * secret that is not a configured RPC URL is a different finding, not this test's concern.
 */
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const TEST_RPC_URL = "https://base-mainnet.g.alchemy.com/v2/test-key-abc123";

describe("logger RPC URL redaction", () => {
  beforeEach(() => {
    // The redaction set is computed at module load, so the env var must exist before the
    // import — resetModules gives each test a fresh logger built from this env.
    vi.resetModules();
    process.env.RPC_URL_EIP155_8453 = TEST_RPC_URL;
  });

  afterEach(() => {
    delete process.env.RPC_URL_EIP155_8453;
  });

  test("redacts the configured RPC URL from message and stack, labeled with its env suffix", async () => {
    const { errSerializer } = await import("../logger.js");
    const err = new Error(
      `RpcRequestError: RPC Request failed.\n\nURL: ${TEST_RPC_URL}\nRequest body: {"method":"eth_estimateGas"}\n\nDetails: execution reverted`,
    );
    const serialized = errSerializer(err) as { message: string; stack: string };
    expect(serialized.message).not.toContain("test-key-abc123");
    expect(serialized.message).toContain("<rpc-url:EIP155_8453>");
    expect(serialized.stack).not.toContain("test-key-abc123");
  });

  test("leaves error content that is not a configured RPC URL untouched", async () => {
    const { errSerializer } = await import("../logger.js");
    const serialized = errSerializer(
      new Error("upstream unreachable: https://mainnet.base.org"),
    ) as { message: string };
    expect(serialized.message).toContain("https://mainnet.base.org");
  });

  test("redacts viem's extra enumerable props, nested objects included", async () => {
    const { errSerializer } = await import("../logger.js");
    const err = new Error("request failed");
    (err as Error & { request: unknown }).request = {
      url: TEST_RPC_URL,
      body: [{ data: "0x1234" }],
    };
    const serialized = errSerializer(err) as { request: { url: string; body: unknown[] } };
    expect(serialized.request.url).toBe("<rpc-url:EIP155_8453>");
  });

  test("passes non-Error values through, redacting any strings among them", async () => {
    const { errSerializer } = await import("../logger.js");
    expect(errSerializer(null)).toBeNull();
    expect(errSerializer("plain string")).toBe("plain string");
    const passed = errSerializer({ detail: TEST_RPC_URL }) as { detail: string };
    expect(passed.detail).toBe("<rpc-url:EIP155_8453>");
  });
});
