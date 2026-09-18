import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Signatures here are real, not mocked — same reasoning as growth_api.test.ts: `verifySignedMessage`
// lives in @fretchen/chain-utils, which resolves its own copy of viem through the symlinked
// workspace package, so a `vi.mock("viem")` in this package cannot reach it. Signing for real is
// also the stronger test of a gate whose whole job is to keep a metered API key from being spent
// by anyone but the owner.
import { privateKeyToAccount } from "viem/accounts";

// Anvil account #0 — a well-known test key, never used for anything real.
const owner = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const OWNER_ADDRESS = owner.address;
// Anvil account #1, standing in for everybody else.
const stranger = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
);

const AUTH_PREFIX = "search-api";

function braveResponse() {
  return {
    grounding: {
      generic: [{ url: "https://example.com/0", title: "Result 0", snippets: ["A snippet."] }],
      poi: null,
      map: [],
    },
    sources: { "https://example.com/0": { title: "Result 0", hostname: "example.com", age: null } },
  };
}

async function makeAuthHeader(
  account: typeof owner = owner,
  { timestamp, prefix = AUTH_PREFIX }: { timestamp?: number; prefix?: string } = {},
): Promise<string> {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const message = `${prefix}:${ts}`;
  const signature = await account.signMessage({ message });
  const payload = JSON.stringify({ address: account.address, signature, message });
  return `Bearer ${Buffer.from(payload).toString("base64")}`;
}

function makeEvent(
  method: string,
  path: string,
  options: { auth?: string | null; query?: Record<string, string> } = {},
) {
  const auth = options.auth === null ? undefined : options.auth;
  return {
    httpMethod: method,
    path: `/${path}`,
    queryStringParameters: options.query ?? {},
    headers: auth ? { Authorization: auth } : {},
  };
}

type Handler = (
  event: Record<string, unknown>,
  context: unknown,
) => Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;

let handle: Handler;
let validAuth: string;

beforeEach(async () => {
  vi.resetModules();
  validAuth = await makeAuthHeader();
  process.env.OWNER_ETH_ADDRESS = OWNER_ADDRESS;
  process.env.BRAVE_API_KEY = "test-token";
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => braveResponse() }),
  );
  handle = (await import("../search_api.js")).handle;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OWNER_ETH_ADDRESS;
  delete process.env.BRAVE_API_KEY;
});

describe("authentication", () => {
  test("rejects a request with no Authorization header", async () => {
    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/missing/i);
  });

  test("rejects a signature from somebody who is not the owner", async () => {
    const res = await handle(
      makeEvent("GET", "search", { auth: await makeAuthHeader(stranger), query: { q: "x402" } }),
      {},
    );

    expect(res.statusCode).toBe(401);
  });

  test("rejects an expired token", async () => {
    const stale = Math.floor(Date.now() / 1000) - 10 * 60;
    const res = await handle(
      makeEvent("GET", "search", {
        auth: await makeAuthHeader(owner, { timestamp: stale }),
        query: { q: "x" },
      }),
      {},
    );

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/expired/i);
  });

  /** The prefix is what stops a token minted for one service being spent on another. */
  test("rejects a token signed for a different service", async () => {
    const res = await handle(
      makeEvent("GET", "search", {
        auth: await makeAuthHeader(owner, { prefix: "analytics-api" }),
        query: { q: "x402" },
      }),
      {},
    );

    expect(res.statusCode).toBe(401);
  });

  test("accepts a second owner from a comma-separated list", async () => {
    process.env.OWNER_ETH_ADDRESS = `${stranger.address},${OWNER_ADDRESS}`;

    const res = await handle(
      makeEvent("GET", "search", { auth: validAuth, query: { q: "x402" } }),
      {},
    );

    expect(res.statusCode).toBe(200);
  });

  /** Fails closed: an unset or empty owner list must not read as "everyone". */
  test.each([
    ["unset", undefined],
    ["empty", ""],
    ["only separators", "  ,  "],
  ])("refuses every caller when OWNER_ETH_ADDRESS is %s", async (_label, value) => {
    if (value === undefined) delete process.env.OWNER_ETH_ADDRESS;
    else process.env.OWNER_ETH_ADDRESS = value;

    const res = await handle(
      makeEvent("GET", "search", { auth: validAuth, query: { q: "x402" } }),
      {},
    );

    expect(res.statusCode).not.toBe(200);
    expect(res.statusCode).toBe(500);
  });

  test("never calls Brave when the caller is not authorised", async () => {
    await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("OPTIONS preflight", () => {
  test("returns 200 with CORS headers, without auth", async () => {
    const res = await handle(makeEvent("OPTIONS", "search", { auth: null }), {});

    expect(res.statusCode).toBe(200);
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(res.headers["Access-Control-Allow-Methods"]).toBe("*");
  });
});

describe("GET /search", () => {
  test("returns the projected results", async () => {
    const res = await handle(
      makeEvent("GET", "search", { auth: validAuth, query: { q: "x402" } }),
      {},
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      results: [{ url: "https://example.com/0", title: "Result 0", text: "A snippet." }],
    });
  });

  /** The caller must not be able to buy itself more context than the proxy budgets for. */
  test("pins the cost knobs whatever the caller passes", async () => {
    await handle(
      makeEvent("GET", "search", {
        auth: validAuth,
        query: {
          q: "x402",
          maximum_number_of_tokens: "32768",
          count: "50",
          maximum_number_of_urls: "50",
        },
      }),
      {},
    );

    const url = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
    expect(url.searchParams.get("maximum_number_of_tokens")).toBe("2048");
    expect(url.searchParams.get("count")).toBe("10");
    expect(url.searchParams.get("maximum_number_of_urls")).toBe("5");
  });

  test.each([
    ["a missing q", {}],
    ["an empty q", { q: "" }],
    ["an over-long q", { q: "x".repeat(601) }],
  ])("answers 400 for %s", async (_label, query) => {
    const res = await handle(makeEvent("GET", "search", { auth: validAuth, query }), {});

    expect(res.statusCode).toBe(400);
  });

  test("answers 500 without detail when Brave fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: "Too Many Requests" }),
    );

    const res = await handle(
      makeEvent("GET", "search", { auth: validAuth, query: { q: "x402" } }),
      {},
    );

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("Internal server error");
  });
});

describe("routing", () => {
  test.each([
    ["an unknown path", "GET", "elsewhere"],
    ["the wrong method", "POST", "search"],
  ])("answers 404 for %s", async (_label, method, path) => {
    const res = await handle(
      makeEvent(method, path, { auth: validAuth, query: { q: "x402" } }),
      {},
    );

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe("Not found");
  });
});
