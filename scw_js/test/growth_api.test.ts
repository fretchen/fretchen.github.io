import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// ===== Mocks =====

const mockS3Send = vi.fn();
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class MockS3Client {
    send = mockS3Send;
  },
  GetObjectCommand: class MockGetObjectCommand {
    constructor(public params: unknown) {}
  },
  PutObjectCommand: class MockPutObjectCommand {
    constructor(public params: unknown) {}
  },
}));

const mockVerifyMessage = vi.fn();
vi.mock("viem", () => ({
  verifyMessage: mockVerifyMessage,
}));

// ===== Test data =====

const OWNER_ADDRESS = "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C";

const sampleQueue = {
  drafts: [
    {
      id: "draft_mastodon_en_20260413",
      created: "2026-04-13T08:00:00Z",
      channel: "mastodon",
      language: "en",
      content: "Check out this blog post!",
      source_blog_post: "prisoners_dilemma",
      hashtags: ["#GameTheory"],
      link: "https://fretchen.eu/blog/prisoners_dilemma",
      status: "pending_approval",
      scheduled_at: null,
    },
    {
      id: "draft_bluesky_en_20260413",
      created: "2026-04-13T08:00:00Z",
      channel: "bluesky",
      language: "en",
      content: "Interesting take on game theory",
      source_blog_post: "prisoners_dilemma",
      hashtags: [],
      link: "https://fretchen.eu/blog/prisoners_dilemma",
      status: "pending_approval",
      scheduled_at: null,
    },
  ],
  approved: [],
  published: [],
  rejected: [],
};

const sampleInsights = {
  website_analytics: {
    pageviews: 1000,
    visitors: 500,
    visits: 700,
    bounces: 200,
    totaltime: 50000,
    top_pages: [],
    top_referrers: [],
    top_events: [],
    event_funnels: {},
  },
  social_metrics: {},
  growth_opportunities: ["Post more about game theory"],
  last_analysis: "2026-04-13T08:00:00Z",
};

const samplePerformance = {
  posts: [
    {
      id: "draft_001",
      channel: "mastodon",
      published_at: "2026-04-12T10:00:00Z",
      platform_id: "123456",
      reblogs: 5,
      favourites: 12,
      replies: 2,
      link_clicks: null,
      website_referral_sessions: 3,
    },
  ],
};

// ===== Helpers =====

function makeAuthHeader(timestamp?: number): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const payload = {
    address: OWNER_ADDRESS,
    signature: "0xvalidsignature",
    message: `growth-api:${ts}`,
  };
  return `Bearer ${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

function makeEvent(
  method: string,
  path: string,
  options: {
    body?: unknown;
    query?: Record<string, string>;
    auth?: string | null;
  } = {},
) {
  const auth = options.auth === null ? undefined : (options.auth ?? makeAuthHeader());
  return {
    httpMethod: method,
    path: `/${path}`,
    body: options.body ? JSON.stringify(options.body) : undefined,
    queryStringParameters: options.query ?? {},
    headers: auth ? { Authorization: auth } : {},
  };
}

function mockS3Read(data: unknown) {
  mockS3Send.mockResolvedValueOnce({
    Body: JSON.stringify(data),
  });
}

function mockS3ReadNotFound() {
  const err = new Error("NoSuchKey");
  err.name = "NoSuchKey";
  mockS3Send.mockRejectedValueOnce(err);
}

function mockS3Write() {
  mockS3Send.mockResolvedValueOnce({});
}

// ===== Tests =====

describe("growth_api", () => {
  let handle: (event: Record<string, unknown>, context: unknown) => Promise<unknown>;

  beforeEach(async () => {
    vi.resetModules();
    mockS3Send.mockReset();
    mockVerifyMessage.mockReset();
    mockVerifyMessage.mockResolvedValue(true);

    process.env.OWNER_ETH_ADDRESS = OWNER_ADDRESS;
    process.env.SCW_ACCESS_KEY = "test-key";
    process.env.SCW_SECRET_KEY = "test-secret";

    const mod = await import("../growth_api.js");
    handle = mod.handle;
  });

  afterEach(() => {
    delete process.env.OWNER_ETH_ADDRESS;
    delete process.env.SCW_ACCESS_KEY;
    delete process.env.SCW_SECRET_KEY;
  });

  // ===== Auth tests =====

  describe("authentication", () => {
    test("returns 401 when Authorization header is missing", async () => {
      const event = makeEvent("GET", "drafts", { auth: null });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error).toMatch(/Missing/i);
    });

    test("returns 401 when signature is invalid", async () => {
      mockVerifyMessage.mockResolvedValueOnce(false);
      const event = makeEvent("GET", "drafts");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error).toMatch(/Invalid wallet signature/i);
    });

    test("returns 401 when address is not the owner", async () => {
      const payload = {
        address: "0x1111111111111111111111111111111111111111",
        signature: "0xvalidsignature",
        message: `growth-api:${Math.floor(Date.now() / 1000)}`,
      };
      const auth = `Bearer ${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
      const event = makeEvent("GET", "drafts", { auth });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error).toMatch(/Not the owner/i);
    });

    test("returns 401 when message timestamp is expired", async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 min ago
      const event = makeEvent("GET", "drafts", { auth: makeAuthHeader(oldTimestamp) });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error).toMatch(/expired/i);
    });

    test("returns 401 when message format is invalid", async () => {
      const payload = {
        address: OWNER_ADDRESS,
        signature: "0xvalidsignature",
        message: "not-the-right-format",
      };
      const auth = `Bearer ${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
      const event = makeEvent("GET", "drafts", { auth });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error).toMatch(/Invalid message format/i);
    });

    test("returns 401 when auth fields are non-string types", async () => {
      const payload = { address: 123, signature: true, message: ["array"] };
      const auth = `Bearer ${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
      const event = makeEvent("GET", "drafts", { auth });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body).error).toMatch(/Missing/i);
    });

    test("returns 401 when address lacks 0x prefix", async () => {
      const payload = {
        address: "AAEBC1441323B8ad6Bdf6793A8428166b510239C",
        signature: "0xvalidsignature",
        message: `growth-api:${Math.floor(Date.now() / 1000)}`,
      };
      const auth = `Bearer ${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
      const event = makeEvent("GET", "drafts", { auth });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(401);
    });

    test("returns 200 with valid auth", async () => {
      mockS3Read(sampleQueue);
      const event = makeEvent("GET", "drafts");
      const res = (await handle(event, {})) as { statusCode: number };
      expect(res.statusCode).toBe(200);
    });
  });

  // ===== OPTIONS =====

  describe("OPTIONS preflight", () => {
    test("returns 200 with CORS headers", async () => {
      const event = makeEvent("OPTIONS", "drafts", { auth: null });
      const res = (await handle(event, {})) as {
        statusCode: number;
        headers: Record<string, string>;
      };
      expect(res.statusCode).toBe(200);
      expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(res.headers["Access-Control-Allow-Methods"]).toBe("*");
    });
  });

  // ===== GET /drafts =====

  describe("GET /drafts", () => {
    test("returns full content queue", async () => {
      mockS3Read(sampleQueue);
      const event = makeEvent("GET", "drafts");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.drafts).toHaveLength(2);
      expect(body.approved).toHaveLength(0);
    });

    test("filters by status query param", async () => {
      mockS3Read(sampleQueue);
      const event = makeEvent("GET", "drafts", { query: { status: "pending_approval" } });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveLength(2);
      expect(body[0].status).toBe("pending_approval");
    });

    test("returns empty queue when no S3 file exists", async () => {
      mockS3ReadNotFound();
      const event = makeEvent("GET", "drafts");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.drafts).toHaveLength(0);
    });
  });

  // ===== GET /insights =====

  describe("GET /insights", () => {
    test("returns insights data", async () => {
      mockS3Read(sampleInsights);
      const event = makeEvent("GET", "insights");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.growth_opportunities).toHaveLength(1);
    });

    test("returns null when no insights file", async () => {
      mockS3ReadNotFound();
      const event = makeEvent("GET", "insights");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toBeNull();
    });
  });

  // ===== GET /performance =====

  describe("GET /performance", () => {
    test("returns performance data", async () => {
      mockS3Read(samplePerformance);
      const event = makeEvent("GET", "performance");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.posts).toHaveLength(1);
    });

    test("returns empty posts when no performance file", async () => {
      mockS3ReadNotFound();
      const event = makeEvent("GET", "performance");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ posts: [] });
    });
  });

  // ===== PUT /drafts/:id =====

  describe("PUT /drafts/:id", () => {
    test("updates a pending draft", async () => {
      mockS3Read(sampleQueue);
      mockS3Write();
      const event = makeEvent("PUT", "drafts/draft_mastodon_en_20260413", {
        body: { content: "Updated content!" },
      });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.content).toBe("Updated content!");
    });

    test("returns 404 for unknown draft ID", async () => {
      mockS3Read(sampleQueue);
      const event = makeEvent("PUT", "drafts/nonexistent", {
        body: { content: "something" },
      });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(404);
    });

    test("returns 400 when body is missing", async () => {
      const event = makeEvent("PUT", "drafts/draft_mastodon_en_20260413");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toMatch(/invalid json/i);
    });

    test("returns 400 when body is invalid JSON", async () => {
      const event = makeEvent("PUT", "drafts/draft_mastodon_en_20260413");
      event.body = "{not valid json";
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(400);
    });
  });

  // ===== POST /drafts/:id/approve =====

  describe("POST /drafts/:id/approve", () => {
    test("approves a draft and moves to approved queue", async () => {
      mockS3Read(sampleQueue);
      mockS3Write();
      const event = makeEvent("POST", "drafts/draft_mastodon_en_20260413/approve", {
        body: { scheduled_at: "2026-04-15T09:00:00Z" },
      });
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe("approved");
      expect(body.scheduled_at).toBe("2026-04-15T09:00:00Z");
    });

    test("approves without scheduled_at", async () => {
      mockS3Read(sampleQueue);
      mockS3Write();
      const event = makeEvent("POST", "drafts/draft_mastodon_en_20260413/approve");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).status).toBe("approved");
    });

    test("returns 404 for unknown draft", async () => {
      mockS3Read(sampleQueue);
      const event = makeEvent("POST", "drafts/nonexistent/approve");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(404);
    });

    test("still approves when body is invalid JSON (body is optional)", async () => {
      mockS3Read(sampleQueue);
      mockS3Write();
      const event = makeEvent("POST", "drafts/draft_mastodon_en_20260413/approve");
      event.body = "{bad json";
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).status).toBe("approved");
    });
  });

  // ===== POST /drafts/:id/reject =====

  describe("POST /drafts/:id/reject", () => {
    test("rejects a draft and moves to rejected queue", async () => {
      mockS3Read(sampleQueue);
      mockS3Write();
      const event = makeEvent("POST", "drafts/draft_bluesky_en_20260413/reject");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).status).toBe("rejected");
    });

    test("returns 404 for unknown draft", async () => {
      mockS3Read(sampleQueue);
      const event = makeEvent("POST", "drafts/nonexistent/reject");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(404);
    });
  });

  // ===== Unknown route =====

  describe("unknown routes", () => {
    test("returns 404 for unknown path", async () => {
      const event = makeEvent("GET", "unknown");
      const res = (await handle(event, {})) as { statusCode: number; body: string };
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body).error).toBe("Not found");
    });
  });
});
