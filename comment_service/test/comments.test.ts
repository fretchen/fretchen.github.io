/**
 * Tests for comments.ts – blog comment system
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";

// Mock AWS SDK
const mockS3Send = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: class {
      send = mockS3Send;
    },
    PutObjectCommand: class {
      params: Record<string, unknown>;
      constructor(params: Record<string, unknown>) {
        this.params = params;
      }
    },
    ListObjectsV2Command: class {
      params: Record<string, unknown>;
      constructor(params: Record<string, unknown>) {
        this.params = params;
      }
    },
    GetObjectCommand: class {
      params: Record<string, unknown>;
      constructor(params: Record<string, unknown>) {
        this.params = params;
      }
    },
  };
});

// Mock global fetch for email notifications
global.fetch = vi.fn() as any;

describe("comments.ts", () => {
  let handle: (event: Record<string, any>, context: unknown) => Promise<any>;

  beforeAll(async () => {
    const module = await import("../comments.ts");
    handle = module.handle;
  });

  beforeEach(() => {
    process.env.SCW_ACCESS_KEY = "test-access-key";
    process.env.SCW_SECRET_KEY = "test-secret-key";
    process.env.NOTIFICATION_EMAIL = "test@example.com";

    vi.clearAllMocks();
    mockS3Send.mockResolvedValue({});
    (global.fetch as any).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    delete process.env.SCW_ACCESS_KEY;
    delete process.env.SCW_SECRET_KEY;
    delete process.env.NOTIFICATION_EMAIL;
  });

  // ===== CORS =====

  describe("CORS", () => {
    test("OPTIONS returns 200 with CORS headers", async () => {
      const res = await handle({ httpMethod: "OPTIONS" }, {});

      expect(res.statusCode).toBe(200);
      expect(res.headers["Access-Control-Allow-Origin"]).toBe("https://www.fretchen.eu");
      expect(res.headers["Access-Control-Allow-Methods"]).toBe("GET, POST, OPTIONS");
    });

    test("OPTIONS returns localhost origin when requested from localhost", async () => {
      const res = await handle({
        httpMethod: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      }, {});

      expect(res.statusCode).toBe(200);
      expect(res.headers["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
    });

    test("OPTIONS falls back to production origin for unknown origins", async () => {
      const res = await handle({
        httpMethod: "OPTIONS",
        headers: { origin: "https://evil.com" },
      }, {});

      expect(res.statusCode).toBe(200);
      expect(res.headers["Access-Control-Allow-Origin"]).toBe("https://www.fretchen.eu");
    });

    test("unsupported method returns 405", async () => {
      const res = await handle({ httpMethod: "DELETE" }, {});

      expect(res.statusCode).toBe(405);
    });
  });

  // ===== GET =====

  describe("GET comments", () => {
    test("returns 400 when page parameter is missing", async () => {
      const res = await handle({
        httpMethod: "GET",
        queryStringParameters: {},
      }, {});

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toBe("Missing page parameter");
    });

    test("returns empty array when no comments exist", async () => {
      mockS3Send.mockResolvedValueOnce({ Contents: null });

      const res = await handle({
        httpMethod: "GET",
        queryStringParameters: { page: "/blog/test" },
      }, {});

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).comments).toEqual([]);
    });

    test("returns comments sorted by timestamp", async () => {
      const comment1 = {
        id: "1", name: "Alice", text: "First", page: "/blog/test",
        timestamp: "2026-03-20T10:00:00.000Z", suspectedAgent: false,
      };
      const comment2 = {
        id: "2", name: "Bob", text: "Second", page: "/blog/test",
        timestamp: "2026-03-21T10:00:00.000Z", suspectedAgent: false,
      };

      mockS3Send.mockResolvedValueOnce({
        Contents: [
          { Key: "comments/abc/2026-03-21T10:00:00.000Z-2.json" },
          { Key: "comments/abc/2026-03-20T10:00:00.000Z-1.json" },
        ],
      });
      mockS3Send.mockResolvedValueOnce({
        Body: { transformToString: () => Promise.resolve(JSON.stringify(comment2)) },
      });
      mockS3Send.mockResolvedValueOnce({
        Body: { transformToString: () => Promise.resolve(JSON.stringify(comment1)) },
      });

      const res = await handle({
        httpMethod: "GET",
        queryStringParameters: { page: "/blog/test" },
      }, {});

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.comments).toHaveLength(2);
      expect(data.comments[0].name).toBe("Alice");
      expect(data.comments[1].name).toBe("Bob");
    });

    test("limits suspected agent comments to 10 per page", async () => {
      const contents: { Key: string }[] = [];
      const getResponses: { Body: { transformToString: () => Promise<string> } }[] = [];

      for (let i = 0; i < 12; i++) {
        contents.push({ Key: `comments/abc/agent-${i}.json` });
        getResponses.push({
          Body: {
            transformToString: () => Promise.resolve(JSON.stringify({
              id: `agent-${i}`, name: "Bot", text: `Spam ${i}`, page: "/blog/test",
              timestamp: `2026-03-${String(i + 1).padStart(2, "0")}T10:00:00.000Z`,
              suspectedAgent: true,
            })),
          },
        });
      }
      for (let i = 0; i < 2; i++) {
        contents.push({ Key: `comments/abc/normal-${i}.json` });
        getResponses.push({
          Body: {
            transformToString: () => Promise.resolve(JSON.stringify({
              id: `normal-${i}`, name: "Human", text: `Real ${i}`, page: "/blog/test",
              timestamp: `2026-03-${String(i + 15).padStart(2, "0")}T10:00:00.000Z`,
              suspectedAgent: false,
            })),
          },
        });
      }

      mockS3Send.mockResolvedValueOnce({ Contents: contents });
      for (const resp of getResponses) {
        mockS3Send.mockResolvedValueOnce(resp);
      }

      const res = await handle({
        httpMethod: "GET",
        queryStringParameters: { page: "/blog/test" },
      }, {});

      const data = JSON.parse(res.body);
      expect(data.comments).toHaveLength(12);
      const agentCount = data.comments.filter((c: any) => c.suspectedAgent).length;
      expect(agentCount).toBe(10);
      const normalCount = data.comments.filter((c: any) => !c.suspectedAgent).length;
      expect(normalCount).toBe(2);
    });
  });

  // ===== POST =====

  describe("POST comment", () => {
    test("creates a comment and returns 201", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.1" },
        body: JSON.stringify({
          name: "Alice",
          text: "Great article!",
          page: "/blog/test",
        }),
      }, {});

      expect(res.statusCode).toBe(201);
      const data = JSON.parse(res.body);
      expect(data.comment.name).toBe("Alice");
      expect(data.comment.text).toBe("Great article!");
      expect(data.comment.page).toBe("/blog/test");
      expect(data.comment.suspectedAgent).toBe(false);
      expect(data.comment.id).toBeDefined();
      expect(data.comment.timestamp).toBeDefined();
    });

    test("stores comment in S3", async () => {
      await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.2" },
        body: JSON.stringify({
          name: "Alice",
          text: "Hello",
          page: "/blog/test",
        }),
      }, {});

      expect(mockS3Send).toHaveBeenCalled();
      const putCommand = mockS3Send.mock.calls[0][0] as any;
      expect(putCommand.params.Bucket).toBe("my-imagestore");
      expect(putCommand.params.Key).toContain("comments/");
      expect(putCommand.params.ContentType).toBe("application/json");

      const storedComment = JSON.parse(putCommand.params.Body);
      expect(storedComment.name).toBe("Alice");
      expect(storedComment.text).toBe("Hello");
    });

    test("defaults name to Anonymous when omitted", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.3" },
        body: JSON.stringify({
          text: "Anonymous comment",
          page: "/blog/test",
        }),
      }, {});

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.body).comment.name).toBe("Anonymous");
    });

    test("returns 400 when text is missing", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.4" },
        body: JSON.stringify({ page: "/blog/test" }),
      }, {});

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toBe("Missing required fields");
    });

    test("returns 400 when page is missing", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.5" },
        body: JSON.stringify({ text: "Hello" }),
      }, {});

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toBe("Missing required fields");
    });

    test("returns 400 when text is only whitespace after sanitization", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.6" },
        body: JSON.stringify({
          text: "   ",
          page: "/blog/test",
        }),
      }, {});

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toBe("Comment text is empty");
    });

    test("strips HTML tags but keeps text content", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.12" },
        body: JSON.stringify({
          text: "<script>alert('xss')</script>",
          page: "/blog/test",
        }),
      }, {});

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.body).comment.text).toBe("alert('xss')");
    });

    test("strips HTML tags from name and text", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.7" },
        body: JSON.stringify({
          name: "<b>Bold</b> Name",
          text: "Hello <script>evil</script> world",
          page: "/blog/test",
        }),
      }, {});

      expect(res.statusCode).toBe(201);
      const comment = JSON.parse(res.body).comment;
      expect(comment.name).toBe("Bold Name");
      expect(comment.text).toBe("Hello evil world");
    });

    test("truncates text at MAX_TEXT_LENGTH", async () => {
      const longText = "a".repeat(3000);
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.8" },
        body: JSON.stringify({
          text: longText,
          page: "/blog/test",
        }),
      }, {});

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.body).comment.text).toHaveLength(2000);
    });

    test("truncates name at MAX_NAME_LENGTH", async () => {
      const longName = "a".repeat(200);
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.9" },
        body: JSON.stringify({
          name: longName,
          text: "Hello",
          page: "/blog/test",
        }),
      }, {});

      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.body).comment.name).toHaveLength(100);
    });

    test("parses body as string when body is a string", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.10" },
        body: JSON.stringify({ text: "Hello", page: "/blog/test" }),
      }, {});

      expect(res.statusCode).toBe(201);
    });

    test("handles body as object when already parsed", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.0.11" },
        body: { text: "Hello", page: "/blog/test" },
      }, {});

      expect(res.statusCode).toBe(201);
    });
  });

  // ===== HONEYPOT / SUSPECTED AGENT =====

  describe("honeypot / suspected agent", () => {
    test("flags comment as suspectedAgent when honeypot is filled", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.1.1" },
        body: JSON.stringify({
          name: "Bot",
          text: "Buy cheap watches",
          page: "/blog/test",
          website: "http://spam.com",
        }),
      }, {});

      expect(res.statusCode).toBe(201);
      const comment = JSON.parse(res.body).comment;
      expect(comment.suspectedAgent).toBe(true);
    });

    test("stores honeypot comment in S3", async () => {
      await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.1.2" },
        body: JSON.stringify({
          text: "Spam",
          page: "/blog/test",
          website: "http://spam.com",
        }),
      }, {});

      expect(mockS3Send).toHaveBeenCalled();
      const storedComment = JSON.parse((mockS3Send.mock.calls[0][0] as any).params.Body);
      expect(storedComment.suspectedAgent).toBe(true);
    });

    test("normal comment has suspectedAgent: false", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.1.3" },
        body: JSON.stringify({
          text: "Normal comment",
          page: "/blog/test",
        }),
      }, {});

      expect(JSON.parse(res.body).comment.suspectedAgent).toBe(false);
    });

    test("empty website field is not flagged", async () => {
      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "100.0.1.4" },
        body: JSON.stringify({
          text: "Normal",
          page: "/blog/test",
          website: "",
        }),
      }, {});

      expect(JSON.parse(res.body).comment.suspectedAgent).toBe(false);
    });
  });

  // ===== RATE LIMITING =====

  describe("rate limiting", () => {
    test("returns 429 after exceeding rate limit", async () => {
      const event = {
        httpMethod: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
        body: JSON.stringify({ text: "Hello", page: "/blog/test" }),
      };

      for (let i = 0; i < 3; i++) {
        const res = await handle(event, {});
        expect(res.statusCode).toBe(201);
      }

      const res = await handle(event, {});
      expect(res.statusCode).toBe(429);
      expect(JSON.parse(res.body).error).toBe("Too many comments. Please wait.");
    });

    test("different IPs have separate rate limits", async () => {
      const event1 = {
        httpMethod: "POST",
        headers: { "x-forwarded-for": "10.0.0.1" },
        body: JSON.stringify({ text: "Hello", page: "/blog/test" }),
      };
      const event2 = {
        httpMethod: "POST",
        headers: { "x-forwarded-for": "10.0.0.2" },
        body: JSON.stringify({ text: "Hello", page: "/blog/test" }),
      };

      for (let i = 0; i < 3; i++) {
        await handle(event1, {});
      }

      const res = await handle(event2, {});
      expect(res.statusCode).toBe(201);
    });
  });

  // ===== EMAIL NOTIFICATION =====

  describe("email notification", () => {
    test("sends email on new comment", async () => {
      await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "5.5.5.5" },
        body: JSON.stringify({
          name: "Alice",
          text: "Great post!",
          page: "/blog/test",
        }),
      }, {});

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as any).mock.calls[0];
      expect(url).toContain("transactional-email");
      const emailBody = JSON.parse(options.body);
      expect(emailBody.to[0].email).toBe("test@example.com");
      expect(emailBody.subject).toContain("/blog/test");
      expect(emailBody.text).toContain("Alice");
      expect(emailBody.text).toContain("Great post!");
    });

    test("includes agent warning in email for suspected agents", async () => {
      await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "6.6.6.6" },
        body: JSON.stringify({
          text: "Spam",
          page: "/blog/test",
          website: "http://spam.com",
        }),
      }, {});

      const emailBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(emailBody.text).toContain("SUSPECTED AGENT");
    });

    test("comment is stored even if email fails", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const res = await handle({
        httpMethod: "POST",
        headers: { "x-forwarded-for": "7.7.7.7" },
        body: JSON.stringify({
          text: "Hello",
          page: "/blog/test",
        }),
      }, {});

      expect(res.statusCode).toBe(201);
      expect(mockS3Send).toHaveBeenCalled();
    });
  });
});
