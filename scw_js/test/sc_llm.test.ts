import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks =====

const { mockVerifyMessage } = vi.hoisted(() => ({
  mockVerifyMessage: vi.fn(),
}));

vi.mock("viem", () => ({
  verifyMessage: mockVerifyMessage,
  parseEther: (eth: string) => BigInt(Math.floor(parseFloat(eth) * 1e18)),
}));

vi.mock("../llm_service.js", () => ({
  callLLMAPI: vi.fn().mockResolvedValue({
    content: "answer",
    usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
    model: "test-model",
  }),
  checkWalletBalance: vi.fn().mockResolvedValue(undefined),
  convertTokensToCost: vi.fn().mockReturnValue(1000n),
  saveLeafToTree: vi.fn().mockResolvedValue(1),
  processMerkleTree: vi.fn().mockResolvedValue(undefined),
  startNewTree: vi.fn().mockResolvedValue(undefined),
}));

// ===== Imports =====

import { handle } from "../sc_llm.js";

// ===== Helpers =====

const VALID_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const VALID_SIG = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";

function freshTs(): number {
  return Math.floor(Date.now() / 1000);
}

function makeBearer(address: string, signature: string, message: string): string {
  return `Bearer ${Buffer.from(JSON.stringify({ address, signature, message })).toString("base64")}`;
}

function makeEvent(authHeader: string, message = "sc-llm message") {
  return {
    httpMethod: "POST",
    headers: { Authorization: authHeader },
    body: JSON.stringify({
      data: { prompt: [{ role: "user", content: message }] },
    }),
    path: "/sc-llm",
  };
}

// ===== Tests =====

describe("sc_llm — replay attack protection (Finding 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Signature is cryptographically valid — only timestamp logic should reject
    mockVerifyMessage.mockResolvedValue(true);
    process.env.NFT_WALLET_PUBLIC_KEY = VALID_ADDRESS;
  });

  it("accepts a current-timestamp signature", async () => {
    const ts = freshTs();
    const event = makeEvent(makeBearer(VALID_ADDRESS, VALID_SIG, `sc-llm:${ts}`));
    const res = await handle(event as Parameters<typeof handle>[0], {});
    expect(res.statusCode).toBe(200);
  });

  it("rejects a signature with a timestamp 6 minutes in the past (replay attack)", async () => {
    const staleTs = freshTs() - 360;
    const event = makeEvent(makeBearer(VALID_ADDRESS, VALID_SIG, `sc-llm:${staleTs}`));
    const res = await handle(event as Parameters<typeof handle>[0], {});
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBe("Token expired");
  });

  it("rejects a signature with a timestamp 6 minutes in the future", async () => {
    const futureTs = freshTs() + 360;
    const event = makeEvent(makeBearer(VALID_ADDRESS, VALID_SIG, `sc-llm:${futureTs}`));
    const res = await handle(event as Parameters<typeof handle>[0], {});
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBe("Token expired");
  });

  it("rejects a message with a wrong prefix", async () => {
    const ts = freshTs();
    const event = makeEvent(makeBearer(VALID_ADDRESS, VALID_SIG, `wrong-prefix:${ts}`));
    const res = await handle(event as Parameters<typeof handle>[0], {});
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBe("Unauthorized");
  });

  it("rejects a message with no format at all (old verify_wallet format)", async () => {
    const event = makeEvent(makeBearer(VALID_ADDRESS, VALID_SIG, "I am a human, please let me in"));
    const res = await handle(event as Parameters<typeof handle>[0], {});
    expect(res.statusCode).toBe(401);
  });

  it("rejects a request with no Authorization header", async () => {
    const event = {
      httpMethod: "POST",
      headers: {},
      body: JSON.stringify({ data: { prompt: [{ role: "user", content: "hi" }] } }),
      path: "/sc-llm",
    };
    const res = await handle(event as Parameters<typeof handle>[0], {});
    expect(res.statusCode).toBe(401);
  });

  it("rejects a cryptographically invalid signature", async () => {
    mockVerifyMessage.mockResolvedValue(false);
    const ts = freshTs();
    const event = makeEvent(makeBearer(VALID_ADDRESS, VALID_SIG, `sc-llm:${ts}`));
    const res = await handle(event as Parameters<typeof handle>[0], {});
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBe("Invalid signature");
  });
});

describe("sc_llm — input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyMessage.mockResolvedValue(true);
    process.env.NFT_WALLET_PUBLIC_KEY = VALID_ADDRESS;
  });

  it("returns 400 for a non-POST method", async () => {
    const res = await handle(
      { httpMethod: "GET", headers: {}, body: null, path: "/" } as Parameters<typeof handle>[0],
      {},
    );
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    const ts = freshTs();
    const event = {
      httpMethod: "POST",
      headers: { Authorization: makeBearer(VALID_ADDRESS, VALID_SIG, `sc-llm:${ts}`) },
      body: "{ not valid json",
      path: "/sc-llm",
    };
    const res = await handle(event as Parameters<typeof handle>[0], {});
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body as string);
    expect(body.error).toBe("Invalid JSON body");
  });
});
