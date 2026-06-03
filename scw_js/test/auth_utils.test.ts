import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks =====

const { mockVerifyMessage } = vi.hoisted(() => ({
  mockVerifyMessage: vi.fn(),
}));

vi.mock("viem", () => ({
  verifyMessage: mockVerifyMessage,
}));

// ===== Imports =====

import { parseBearerToken, verifySignedMessage } from "../auth_utils.js";

// ===== Helpers =====

const VALID_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const VALID_SIGNATURE = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";

function makeToken(payload: Record<string, unknown>): string {
  return `Bearer ${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

function freshTs(): number {
  return Math.floor(Date.now() / 1000);
}

// ===== parseBearerToken =====

describe("parseBearerToken", () => {
  it("returns parsed payload for a valid Bearer token", () => {
    const payload = {
      address: VALID_ADDRESS,
      signature: VALID_SIGNATURE,
      message: "leaf-history:1234",
    };
    const result = parseBearerToken(makeToken(payload));
    expect(result).toEqual(payload);
  });

  it("returns null for undefined header", () => {
    expect(parseBearerToken(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseBearerToken("")).toBeNull();
  });

  it("returns null for Basic auth (not Bearer)", () => {
    expect(parseBearerToken("Basic abc123")).toBeNull();
  });

  it("returns null for invalid base64 content", () => {
    expect(parseBearerToken("Bearer !!!notbase64!!!")).toBeNull();
  });

  it("returns null when base64 decodes to non-JSON", () => {
    const token = `Bearer ${Buffer.from("hello world").toString("base64")}`;
    expect(parseBearerToken(token)).toBeNull();
  });

  it("returns null when address field is missing", () => {
    expect(parseBearerToken(makeToken({ signature: VALID_SIGNATURE, message: "m" }))).toBeNull();
  });

  it("returns null when address is not a string", () => {
    expect(
      parseBearerToken(makeToken({ address: 123, signature: VALID_SIGNATURE, message: "m" })),
    ).toBeNull();
  });

  it("returns null when address lacks 0x prefix", () => {
    expect(
      parseBearerToken(
        makeToken({ address: "notanaddress", signature: VALID_SIGNATURE, message: "m" }),
      ),
    ).toBeNull();
  });

  it("returns null when signature lacks 0x prefix", () => {
    expect(
      parseBearerToken(
        makeToken({ address: VALID_ADDRESS, signature: "nosigprefix", message: "m" }),
      ),
    ).toBeNull();
  });

  it("returns null when signature is not a string", () => {
    expect(
      parseBearerToken(makeToken({ address: VALID_ADDRESS, signature: true, message: "m" })),
    ).toBeNull();
  });

  it("returns null when message is empty string", () => {
    expect(
      parseBearerToken(
        makeToken({ address: VALID_ADDRESS, signature: VALID_SIGNATURE, message: "" }),
      ),
    ).toBeNull();
  });

  it("returns null when message is not a string", () => {
    expect(
      parseBearerToken(
        makeToken({ address: VALID_ADDRESS, signature: VALID_SIGNATURE, message: ["array"] }),
      ),
    ).toBeNull();
  });

  it("is safe against __proto__ injection — Object.prototype is not modified", () => {
    // A crafted raw JSON string attempting prototype pollution
    const rawJson = `{"__proto__":{"isAdmin":true},"address":"${VALID_ADDRESS}","signature":"${VALID_SIGNATURE}","message":"leaf-history:1234"}`;
    const token = `Bearer ${Buffer.from(rawJson).toString("base64")}`;
    parseBearerToken(token);
    // Object.prototype must remain unmodified regardless of what JSON.parse does
    expect((Object.prototype as Record<string, unknown>).isAdmin).toBeUndefined();
  });
});

// ===== verifySignedMessage =====

describe("verifySignedMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for a fully valid payload", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    const ts = freshTs();
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${ts}`,
      "leaf-history",
      VALID_ADDRESS,
    );
    expect(result).toBeNull();
  });

  it("returns 'Unauthorized' for a timestamp far in the future (overflow guard)", async () => {
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      "leaf-history:99999999999",
      "leaf-history",
      VALID_ADDRESS,
    );
    expect(result).toBe("Unauthorized");
  });

  it("returns 'Unauthorized' for wrong message prefix", async () => {
    const ts = freshTs();
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `wrong-prefix:${ts}`,
      "leaf-history",
      VALID_ADDRESS,
    );
    expect(result).toBe("Unauthorized");
  });

  it("returns 'Unauthorized' for completely malformed message", async () => {
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      "not-a-valid-message",
      "leaf-history",
      VALID_ADDRESS,
    );
    expect(result).toBe("Unauthorized");
  });

  it("returns 'Token expired' for timestamp 6 minutes in the past", async () => {
    const staleTs = freshTs() - 360;
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${staleTs}`,
      "leaf-history",
      VALID_ADDRESS,
    );
    expect(result).toBe("Token expired");
  });

  it("returns 'Token expired' for timestamp 6 minutes in the future", async () => {
    const futureTs = freshTs() + 360;
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${futureTs}`,
      "leaf-history",
      VALID_ADDRESS,
    );
    expect(result).toBe("Token expired");
  });

  it("returns 'Address mismatch' when payload address differs from expected", async () => {
    const ts = freshTs();
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${ts}`,
      "leaf-history",
      "0xdeadbeef00000000000000000000000000000000",
    );
    expect(result).toBe("Address mismatch");
  });

  it("passes case-insensitive address comparison", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    const ts = freshTs();
    const upper = VALID_ADDRESS.toUpperCase().replace("0X", "0x");
    const lower = VALID_ADDRESS.toLowerCase();
    const result = await verifySignedMessage(
      upper,
      VALID_SIGNATURE,
      `leaf-history:${ts}`,
      "leaf-history",
      lower,
    );
    expect(result).toBeNull();
  });

  it("returns 'Invalid signature' when verifyMessage returns false", async () => {
    mockVerifyMessage.mockResolvedValue(false);
    const ts = freshTs();
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${ts}`,
      "leaf-history",
      VALID_ADDRESS,
    );
    expect(result).toBe("Invalid signature");
  });

  it("returns 'Invalid signature' when verifyMessage throws", async () => {
    mockVerifyMessage.mockRejectedValue(new Error("RPC error"));
    const ts = freshTs();
    const result = await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      `leaf-history:${ts}`,
      "leaf-history",
      VALID_ADDRESS,
    );
    expect(result).toBe("Invalid signature");
  });

  it("calls verifyMessage with the exact address, message, and signature", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    const ts = freshTs();
    const message = `leaf-history:${ts}`;
    await verifySignedMessage(
      VALID_ADDRESS,
      VALID_SIGNATURE,
      message,
      "leaf-history",
      VALID_ADDRESS,
    );
    expect(mockVerifyMessage).toHaveBeenCalledWith({
      address: VALID_ADDRESS,
      message,
      signature: VALID_SIGNATURE,
    });
  });
});
