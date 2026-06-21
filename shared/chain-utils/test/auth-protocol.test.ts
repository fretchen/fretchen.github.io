import { describe, test, expect, vi, afterEach } from "vitest";
import { AUTH_TOKEN_MAX_AGE_MS, buildAuthMessage } from "../src/auth-protocol";

describe("AUTH_TOKEN_MAX_AGE_MS", () => {
  test("is exactly 5 minutes in milliseconds", () => {
    expect(AUTH_TOKEN_MAX_AGE_MS).toBe(300_000);
  });
});

describe("buildAuthMessage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns prefix:unix-seconds format", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    expect(buildAuthMessage("sc-llm")).toBe("sc-llm:1704067200");
  });

  test("uses seconds not milliseconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_700_000_500_123); // 500.123 seconds into epoch second 1700000500
    const msg = buildAuthMessage("leaf-history");
    const ts = parseInt(msg.split(":")[1], 10);
    expect(ts).toBe(1_700_000_500);
    expect(ts.toString()).not.toContain(".");
  });

  test("includes the prefix verbatim", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    expect(buildAuthMessage("growth-api")).toMatch(/^growth-api:/);
    expect(buildAuthMessage("sc-llm")).toMatch(/^sc-llm:/);
  });

  test("message is parseable server-side: prefix:<digits>", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000_000_000);
    const msg = buildAuthMessage("test");
    expect(msg).toMatch(/^test:\d+$/);
  });
});
