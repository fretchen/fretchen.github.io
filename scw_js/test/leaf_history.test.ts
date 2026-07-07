import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Mocks (vi.hoisted ensures these are available when vi.mock factories run) =====

const { mockGetS3Object } = vi.hoisted(() => ({
  mockGetS3Object: vi.fn(),
}));

vi.mock("@fretchen/s3-utils", () => ({
  getS3Object: mockGetS3Object,
}));

// ===== Import after mocks =====

import { handle } from "../leaf_history.js";

// ===== Helpers =====

const TEST_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

function makeEvent(options: { address?: string } = {}) {
  const address = options.address ?? TEST_ADDRESS;
  return {
    httpMethod: "GET",
    queryStringParameters: { address },
    headers: {},
  };
}

const sampleTree = {
  treeIndex: 0,
  processed: true,
  root: "0xabc",
  leaves: [
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

  it("returns 200 with leaves filtered to the requested address (no auth required)", async () => {
    mockGetS3Object.mockResolvedValue(JSON.stringify({ trees: [sampleTree] }));

    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body) as { leafs: unknown[]; count: number; address: string };
    expect(body.address).toBe(TEST_ADDRESS);
    expect(body.count).toBe(1);
    expect(body.leafs).toHaveLength(1);
    expect((body.leafs[0] as { id: number }).id).toBe(1);
  });

  it("returns 500 when S3 read fails", async () => {
    mockGetS3Object.mockRejectedValue(new Error("S3 error"));

    const res = await handle(makeEvent(), {});
    expect(res.statusCode).toBe(500);
  });
});
