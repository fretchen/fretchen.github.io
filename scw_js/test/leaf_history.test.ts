import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks (vi.hoisted ensures these are available when vi.mock factories run) =====

const { mockGetS3Object, mockVerifyMessage } = vi.hoisted(() => ({
  mockGetS3Object: vi.fn(),
  mockVerifyMessage: vi.fn(),
}));

vi.mock("@fretchen/s3-utils", () => ({
  getS3Object: mockGetS3Object,
}));

vi.mock("viem", () => ({
  verifyMessage: mockVerifyMessage,
}));

// ===== Import after mocks =====

import { handle } from "../leaf_history.js";

// ===== Helpers =====

const TEST_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

function makeAuthHeader(address: string = TEST_ADDRESS, timestamp?: number): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const payload = { address, signature: "0xvalidsignature", message: `leaf-history:${ts}` };
  return `Bearer ${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

function makeEvent(
  options: {
    address?: string;
    auth?: string | null;
  } = {},
) {
  const address = options.address ?? TEST_ADDRESS;
  const auth = options.auth === null ? undefined : (options.auth ?? makeAuthHeader(address));
  return {
    httpMethod: "GET",
    queryStringParameters: { address },
    headers: auth ? { authorization: auth } : {},
  };
}

const sampleTree = {
  treeIndex: 0,
  processed: true,
  root: "0xabc",
  leafs: [
    {
      id: 1,
      user: TEST_ADDRESS,
      serviceProvider: "0xservice",
      tokenCount: "100",
      cost: "1000000000000000",
      timestamp: "2026-01-01T00:00:00Z",
    },
    {
      id: 2,
      user: "0xother000000000000000000000000000000000000",
      serviceProvider: "0xservice",
      tokenCount: "50",
      cost: "500000000000000",
      timestamp: "2026-01-02T00:00:00Z",
    },
  ],
};

// ===== Tests =====

describe("handle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SCW_ACCESS_KEY = "test-access-key";
    process.env.SCW_SECRET_KEY = "test-secret-key";
  });

  it("returns 200 for OPTIONS preflight", async () => {
    const res = await handle({ httpMethod: "OPTIONS" }, {});
    expect(res.statusCode).toBe(200);
  });

  it("returns 400 for missing address", async () => {
    const res = await handle({ httpMethod: "GET", queryStringParameters: {}, headers: {} }, {});
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid address format", async () => {
    const res = await handle(
      { httpMethod: "GET", queryStringParameters: { address: "notanaddress" }, headers: {} },
      {},
    );
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 when Authorization header is absent", async () => {
    const res = await handle(makeEvent({ auth: null }), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Unauthorized");
  });

  it("returns 401 when payload address differs from query address", async () => {
    const auth = makeAuthHeader("0xdeadbeef00000000000000000000000000000000");
    const res = await handle(makeEvent({ auth }), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Address mismatch");
  });

  it("returns 401 when timestamp is older than 5 minutes", async () => {
    const staleTs = Math.floor(Date.now() / 1000) - 6 * 60;
    const auth = makeAuthHeader(TEST_ADDRESS, staleTs);
    const res = await handle(makeEvent({ auth }), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Token expired");
  });

  it("returns 401 when verifyMessage returns false", async () => {
    mockVerifyMessage.mockResolvedValue(false);
    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("Invalid signature");
  });

  it("returns 200 with leafs filtered to the requesting address", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    mockGetS3Object.mockResolvedValue(JSON.stringify({ trees: [sampleTree] }));

    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body) as { leafs: unknown[]; count: number; address: string };
    expect(body.address).toBe(TEST_ADDRESS);
    expect(body.count).toBe(1);
    expect(body.leafs).toHaveLength(1);
    expect((body.leafs[0] as { id: number }).id).toBe(1);
  });

  it("reads Authorization header in capitalized form", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    mockGetS3Object.mockResolvedValue(JSON.stringify({ trees: [] }));
    const res = await handle(
      {
        httpMethod: "GET",
        queryStringParameters: { address: TEST_ADDRESS },
        headers: { Authorization: makeAuthHeader() },
      },
      {},
    );
    expect(res.statusCode).toBe(200);
  });

  it("returns 500 when S3 read fails", async () => {
    mockVerifyMessage.mockResolvedValue(true);
    mockGetS3Object.mockRejectedValue(new Error("S3 error"));

    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(500);
  });
});
