import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";

const { mockVerifyMessage } = vi.hoisted(() => ({
  mockVerifyMessage: vi.fn(),
}));

vi.mock("viem", () => ({
  verifyMessage: mockVerifyMessage,
}));

import {
  AUTH_TOKEN_MAX_AGE_MS,
  buildAuthMessage,
  parseBearerToken,
  verifySignedMessage,
} from "../src/auth-protocol";

const VALID_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const VALID_SIGNATURE = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";

function makeToken(payload: Record<string, unknown>): string {
  return `Bearer ${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

function freshTs(): number {
  return Math.floor(Date.now() / 1000);
}

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

describe("round trip", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("a message built here verifies here — the two halves agree on the wire format", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    const message = buildAuthMessage("analytics-api");

    const token = parseBearerToken(
      makeToken({ address: VALID_ADDRESS, signature: VALID_SIGNATURE, message })
    );
    expect(token).not.toBeNull();

    const err = await verifySignedMessage(
      token!.address,
      token!.signature,
      token!.message,
      "analytics-api",
      VALID_ADDRESS
    );
    expect(err).toBeNull();
  });
});

describe("parseBearerToken", () => {
  test("returns parsed payload for a valid Bearer token", () => {
    const payload = {
      address: VALID_ADDRESS,
      signature: VALID_SIGNATURE,
      message: "leaf-history:1234",
    };
    expect(parseBearerToken(makeToken(payload))).toEqual(payload);
  });

  test("returns null for undefined header", () => {
    expect(parseBearerToken(undefined)).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseBearerToken("")).toBeNull();
  });

  test("returns null for Basic auth (not Bearer)", () => {
    expect(parseBearerToken("Basic abc123")).toBeNull();
  });

  test("returns null for invalid base64 content", () => {
    expect(parseBearerToken("Bearer !!!notbase64!!!")).toBeNull();
  });

  test("returns null when base64 decodes to non-JSON", () => {
    const token = `Bearer ${Buffer.from("hello world").toString("base64")}`;
    expect(parseBearerToken(token)).toBeNull();
  });

  test("returns null when address field is missing", () => {
    expect(parseBearerToken(makeToken({ signature: VALID_SIGNATURE, message: "m" }))).toBeNull();
  });

  test("returns null when address is not a string", () => {
    expect(
      parseBearerToken(makeToken({ address: 123, signature: VALID_SIGNATURE, message: "m" }))
    ).toBeNull();
  });

  test("returns null when address lacks 0x prefix", () => {
    expect(
      parseBearerToken(
        makeToken({ address: "notanaddress", signature: VALID_SIGNATURE, message: "m" })
      )
    ).toBeNull();
  });

  test("returns null when signature lacks 0x prefix", () => {
    expect(
      parseBearerToken(
        makeToken({ address: VALID_ADDRESS, signature: "nosigprefix", message: "m" })
      )
    ).toBeNull();
  });

  test("returns null when signature is not a string", () => {
    expect(
      parseBearerToken(makeToken({ address: VALID_ADDRESS, signature: true, message: "m" }))
    ).toBeNull();
  });

  test("returns null when message is empty string", () => {
    expect(
      parseBearerToken(
        makeToken({ address: VALID_ADDRESS, signature: VALID_SIGNATURE, message: "" })
      )
    ).toBeNull();
  });

  test("returns null when message is not a string", () => {
    expect(
      parseBearerToken(
        makeToken({ address: VALID_ADDRESS, signature: VALID_SIGNATURE, message: ["array"] })
      )
    ).toBeNull();
  });

  test("is safe against __proto__ injection — Object.prototype is not modified", () => {
    // A crafted raw JSON string attempting prototype pollution
    const rawJson = `{"__proto__":{"isAdmin":true},"address":"${VALID_ADDRESS}","signature":"${VALID_SIGNATURE}","message":"leaf-history:1234"}`;
    const token = `Bearer ${Buffer.from(rawJson).toString("base64")}`;
    parseBearerToken(token);
    // Object.prototype must remain unmodified regardless of what JSON.parse does
    expect((Object.prototype as Record<string, unknown>).isAdmin).toBeUndefined();
  });
});

describe("verifySignedMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns null for a fully valid payload", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${freshTs()}`,
      "leaf-history",
      VALID_ADDRESS
    );
    expect(result).toBeNull();
  });

  test("returns 'Unauthorized' for a timestamp far in the future (overflow guard)", async () => {
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      "leaf-history:99999999999",
      "leaf-history",
      VALID_ADDRESS
    );
    expect(result).toBe("Unauthorized");
  });

  test("returns 'Unauthorized' for wrong message prefix", async () => {
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `wrong-prefix:${freshTs()}`,
      "leaf-history",
      VALID_ADDRESS
    );
    expect(result).toBe("Unauthorized");
  });

  test("returns 'Unauthorized' for completely malformed message", async () => {
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      "not-a-valid-message",
      "leaf-history",
      VALID_ADDRESS
    );
    expect(result).toBe("Unauthorized");
  });

  test("returns 'Token expired' for timestamp 6 minutes in the past", async () => {
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${freshTs() - 360}`,
      "leaf-history",
      VALID_ADDRESS
    );
    expect(result).toBe("Token expired");
  });

  test("returns 'Token expired' for timestamp 6 minutes in the future", async () => {
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${freshTs() + 360}`,
      "leaf-history",
      VALID_ADDRESS
    );
    expect(result).toBe("Token expired");
  });

  test("returns 'Address mismatch' when payload address differs from expected", async () => {
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${freshTs()}`,
      "leaf-history",
      "0xdeadbeef00000000000000000000000000000000"
    );
    expect(result).toBe("Address mismatch");
  });

  test("passes case-insensitive address comparison", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    const upper = VALID_ADDRESS.toUpperCase().replace("0X", "0x");
    const result = await verifySignedMessage(
      upper,
      VALID_SIGNATURE,
      `leaf-history:${freshTs()}`,
      "leaf-history",
      VALID_ADDRESS.toLowerCase()
    );
    expect(result).toBeNull();
  });

  test("returns 'Invalid signature' when verifyMessage returns false", async () => {
    mockVerifyMessage.mockResolvedValue(false);
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${freshTs()}`,
      "leaf-history",
      VALID_ADDRESS
    );
    expect(result).toBe("Invalid signature");
  });

  test("returns 'Invalid signature' when verifyMessage throws", async () => {
    mockVerifyMessage.mockRejectedValue(new Error("RPC error"));
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${freshTs()}`,
      "leaf-history",
      VALID_ADDRESS
    );
    expect(result).toBe("Invalid signature");
  });

  test("calls verifyMessage with the exact address, message, and signature", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    const message = `leaf-history:${freshTs()}`;
    await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      message,
      "leaf-history",
      VALID_ADDRESS
    );
    expect(mockVerifyMessage).toHaveBeenCalledWith({
      address: VALID_ADDRESS,
      message,
      signature: VALID_SIGNATURE,
    });
  });
});
