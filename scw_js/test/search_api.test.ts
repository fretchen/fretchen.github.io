import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Kept only to build a genuinely valid owner bearer, which the "no free path" cases below send to
// prove it now buys nothing. Signing for real rather than mocking: `verifySignedMessage` resolves
// its own copy of viem through the symlinked workspace package, so a `vi.mock("viem")` here could
// never have reached it anyway — and a hand-faked token would not prove the point, since the thing
// being asserted is that even a CORRECT signature is ignored.
import { privateKeyToAccount } from "viem/accounts";
import { USDC_ADDRESSES, EURC_ADDRESSES } from "@fretchen/chain-utils";

// DNS is stubbed so these stay hermetic: /fetch resolves every hostname before connecting, and a
// test that needs a working resolver fails on an offline machine for reasons that have nothing to
// do with the code. Literal IPs still take the real path through isPrivateAddress.
const mockLookup = vi.fn();
vi.mock("node:dns/promises", () => ({ lookup: mockLookup }));

// The x402 seller is mocked the way sc_llm_x402.test.ts mocks it: the SDK wants S3, a receiver
// authorizer key and a chain, none of which belong in a unit test. `@fretchen/chain-utils` stays
// REAL here — the signature checks above depend on it, and the stablecoin registry is a pure
// lookup whose answer (which asset is priced how) is part of what these tests check.
const {
  mockCreateLLMResourceServer,
  mockCreateBatchSettlementPaymentRequirements,
  mockCreate402Response,
  mockExtractPaymentPayload,
  mockCreateSettlementHeaders,
  mockVerifyPayment,
  mockSettlePayment,
  mockCreatePaymentRequiredResponse,
  mockEnhancePaymentRequirements,
} = vi.hoisted(() => ({
  mockCreateLLMResourceServer: vi.fn(),
  mockCreateBatchSettlementPaymentRequirements: vi.fn(),
  mockCreate402Response: vi.fn(),
  mockExtractPaymentPayload: vi.fn(),
  mockCreateSettlementHeaders: vi.fn(),
  mockVerifyPayment: vi.fn(),
  mockSettlePayment: vi.fn(),
  mockCreatePaymentRequiredResponse: vi.fn(),
  mockEnhancePaymentRequirements: vi.fn(),
}));

vi.mock("../x402_server.js", () => ({
  createLLMResourceServer: mockCreateLLMResourceServer,
  createBatchSettlementPaymentRequirements: mockCreateBatchSettlementPaymentRequirements,
  create402Response: mockCreate402Response,
  extractPaymentPayload: mockExtractPaymentPayload,
  createSettlementHeaders: mockCreateSettlementHeaders,
}));

/** The seller's own address — `NFT_WALLET_PUBLIC_KEY`, shared with the chat so both land on one
 *  payment channel. Anvil account #2, standing in for it. */
const RECEIVER = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

/** A payment payload, as the SDK would hand it over after decoding the header. */
function payment(network = "eip155:10", asset: string = USDC_ADDRESSES[network]) {
  return { accepted: { network, asset }, payload: { voucher: "0xsigned" } };
}

// Anvil account #0 — a well-known test key, never used for anything real.
const owner = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const OWNER_ADDRESS = owner.address;
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
) => Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  /** Set by the favicon branch only. Mirrored from the handler's own return type so the
   *  discovery assertions below are checked rather than silently typed away. */
  isBase64Encoded?: boolean;
}>;

let handle: Handler;
let validAuth: string;

beforeEach(async () => {
  vi.resetModules();
  mockLookup.mockReset();
  // Hostnames resolve public by default; the private-address cases below use literal IPs, which
  // node's lookup returns verbatim.
  mockLookup.mockImplementation((host: string) =>
    Promise.resolve([{ address: /^[\d.]+$/.test(host) ? host : "93.184.216.34", family: 4 }]),
  );
  validAuth = await makeAuthHeader();
  process.env.OWNER_ETH_ADDRESS = OWNER_ADDRESS;
  process.env.BRAVE_API_KEY = "test-token";
  process.env.NFT_WALLET_PUBLIC_KEY = RECEIVER;

  vi.clearAllMocks();
  mockCreateLLMResourceServer.mockReturnValue({
    resourceServer: {
      verifyPayment: mockVerifyPayment,
      settlePayment: mockSettlePayment,
      createPaymentRequiredResponse: mockCreatePaymentRequiredResponse,
    },
    scheme: { enhancePaymentRequirements: mockEnhancePaymentRequirements },
  });
  // Echoes the options back, so a test can read what the handler advertised.
  mockCreateBatchSettlementPaymentRequirements.mockImplementation(
    (opts: {
      resourceUrl: string;
      usdAmount: string;
      payTo: string;
      networks: string[];
      maxTimeoutSeconds: number;
    }) => ({
      x402Version: 2,
      resource: { url: opts.resourceUrl },
      accepts: opts.networks.map((network) => ({
        network,
        amount: opts.usdAmount,
        payTo: opts.payTo,
        maxTimeoutSeconds: opts.maxTimeoutSeconds,
      })),
    }),
  );
  mockCreate402Response.mockImplementation((requirements: unknown) => ({
    statusCode: 402,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requirements),
  }));
  // Stands in for the real enhancement, which stamps on receiverAuthorizer/withdrawDelay.
  mockEnhancePaymentRequirements.mockImplementation((base: Record<string, unknown>) => ({
    ...base,
    extra: { ...(base.extra as object), receiverAuthorizer: "0xauthorizer" },
  }));
  mockExtractPaymentPayload.mockReturnValue(null);
  mockVerifyPayment.mockResolvedValue({ isValid: true, payer: "0xpayer" });
  mockSettlePayment.mockResolvedValue({ success: true, transaction: "", network: "eip155:10" });
  mockCreatePaymentRequiredResponse.mockResolvedValue({
    x402Version: 2,
    error: "channel_busy",
    accepts: [],
  });
  mockCreateSettlementHeaders.mockReturnValue({ "Payment-Response": "encoded" });
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
  delete process.env.NFT_WALLET_PUBLIC_KEY;
});

/**
 * There is one way in: payment. The owner-signature path was removed — `genimg` and `llmx402`
 * never had one, and the consumer it was justified by (server-side callers without a funded
 * wallet) turned out not to exist. What these pin is that its removal did not leave a crack:
 * a bearer is now just an ignored header, not a cheaper route.
 */
describe("no free path", () => {
  test("quotes a price for a request with no Authorization header", async () => {
    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(res.statusCode).toBe(402);
  });

  /**
   * The regression guard for this change. A token that used to be served for free — correctly
   * signed, current, right prefix, right owner — must now be quoted a price like anything else,
   * and must not reach the metered upstream on the way.
   */
  test("quotes a price even for what used to be a valid owner token", async () => {
    const res = await handle(
      makeEvent("GET", "search", { auth: validAuth, query: { q: "x402" } }),
      {},
    );

    expect(res.statusCode).toBe(402);
    expect(fetch).not.toHaveBeenCalled();
  });

  /** OWNER_ETH_ADDRESS is no longer read by this endpoint at all; setting it buys nobody a
   *  free call. It stays in the environment for growthapi and analytics. */
  test("serves nobody free even when OWNER_ETH_ADDRESS names the signer", async () => {
    process.env.OWNER_ETH_ADDRESS = OWNER_ADDRESS;

    const res = await handle(
      makeEvent("GET", "search", { auth: validAuth, query: { q: "x402" } }),
      {},
    );

    expect(res.statusCode).toBe(402);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("never calls Brave when the caller has not paid", async () => {
    await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("OPTIONS preflight", () => {
  test("returns 200 without auth or payment", async () => {
    const res = await handle(makeEvent("OPTIONS", "search", { auth: null }), {});

    expect(res.statusCode).toBe(200);
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(res.headers["Access-Control-Allow-Methods"]).toContain("GET");
  });

  /** Both directions, and they are unrelated despite the similar names: the payment header must be
   *  allowed on the request, and the settlement header must be readable on the response. Without
   *  the second, a browser buyer's channel record goes stale and it re-deposits every call. */
  test("allows the payment header and exposes the settlement header", async () => {
    const res = await handle(makeEvent("OPTIONS", "search", { auth: null }), {});

    expect(res.headers["Access-Control-Allow-Headers"]).toContain("PAYMENT-SIGNATURE");
    expect(res.headers["Access-Control-Expose-Headers"]).toContain("Payment-Response");
  });

  /**
   * `Authorization` is deliberately NOT named any more. It had to be, while the owner bearer was a
   * way in — it is the one header a `*` wildcard does not cover. With that path gone the endpoint
   * is payment-only like `genimg` and `llmx402`, and the shared `CORS_HEADERS` is the honest
   * description of what it accepts. Asserted rather than left implicit, because silently
   * re-widening the preflight is how a removed auth path grows back.
   */
  test("does not advertise Authorization, which nothing sends any more", async () => {
    const res = await handle(makeEvent("OPTIONS", "search", { auth: null }), {});

    expect(res.headers["Access-Control-Allow-Headers"]).not.toContain("Authorization");
  });
});

/**
 * These exercise the route's behaviour, which now means exercising it PAID — there is no other way
 * in since the owner signature was removed. Note what that changes about validation: an unpaid
 * request is answered with a 402 before its query is ever looked at (a client probing for terms is
 * not first told its query is malformed), so a 400 is only reachable once a payment payload is
 * present. It still costs nothing — `parseArgs` runs before verify and settle.
 */
describe("GET /search", () => {
  beforeEach(() => {
    mockExtractPaymentPayload.mockReturnValue(payment());
  });

  test("returns the projected results", async () => {
    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      results: [{ url: "https://example.com/0", title: "Result 0", text: "A snippet." }],
    });
  });

  /** The caller must not be able to buy itself more context than the proxy budgets for. */
  test("pins the cost knobs whatever the caller passes", async () => {
    await handle(
      makeEvent("GET", "search", {
        auth: null,
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
    const res = await handle(makeEvent("GET", "search", { auth: null, query }), {});

    expect(res.statusCode).toBe(400);
  });

  test("answers 500 without detail when Brave fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: "Too Many Requests" }),
    );

    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("Internal server error");
  });
});

describe("GET /fetch", () => {
  beforeEach(() => {
    mockExtractPaymentPayload.mockReturnValue(payment());
  });

  /** The whole point of the shared function: one way in, priced per route, in front of both. */
  test("quotes a price when unpaid, exactly as /search does", async () => {
    mockExtractPaymentPayload.mockReturnValue(null);

    const res = await handle(
      makeEvent("GET", "fetch", { auth: null, query: { url: "https://example.com/" } }),
      {},
    );

    expect(res.statusCode).toBe(402);
  });

  test("returns the fetched envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        statusText: "OK",
        headers: new Headers({ "content-type": "text/html" }),
        body: new Blob(["<html><article><p>Hello</p></article></html>"]).stream(),
      }),
    );

    const res = await handle(
      makeEvent("GET", "fetch", { auth: null, query: { url: "https://example.com/" } }),
      {},
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toMatchObject({
      finalUrl: "https://example.com/",
      contentType: "text/html",
    });
  });

  /** An SSRF refusal must read as a caller error the model can correct, not as a 500. */
  test.each([
    ["a missing url", {}],
    ["an http url", { url: "http://example.com/" }],
    ["a file url", { url: "file:///etc/passwd" }],
    ["a loopback url", { url: "https://127.0.0.1/" }],
    ["a metadata url", { url: "https://169.254.169.254/" }],
  ])("answers 400 for %s", async (_label, query) => {
    const res = await handle(makeEvent("GET", "fetch", { auth: null, query }), {});

    expect(res.statusCode).toBe(400);
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

  /** A resource that does not exist has no price — quoting one would advertise a route that
   *  answers 404 the moment it is paid for. */
  test("answers 404 for an unknown path without quoting a price", async () => {
    const res = await handle(makeEvent("GET", "elsewhere", { auth: null }), {});

    expect(res.statusCode).toBe(404);
    expect(mockCreateBatchSettlementPaymentRequirements).not.toHaveBeenCalled();
  });
});

/**
 * Discovery: free, unauthenticated, unpaid.
 *
 * These exist so something that has never heard of this endpoint can find it. x402scan resolves an
 * icon by fetching the origin ROOT and parsing `<link rel="icon">` before it probes any favicon
 * path (see discovery.ts), so the root HTML is what makes the crawler index the origin at all — a
 * published spec nobody crawls is not discovery. Every one of these paths returned 404 before
 * PR 3, verified against the live endpoint.
 */
describe("discovery", () => {
  function discoveryEvent(method: string, path: string, headers: Record<string, string> = {}) {
    return { httpMethod: method, path: `/${path}`, queryStringParameters: {}, headers };
  }

  test("serves the generated spec, unpaid and unauthenticated", async () => {
    const res = await handle(discoveryEvent("GET", "openapi.json"), {});

    expect(res.statusCode).toBe(200);
    const spec = JSON.parse(res.body) as Record<string, unknown>;
    expect(spec["openapi"]).toBe("3.1.0");
    expect(spec["x-service-type"]).toBe("web/v1");
    expect(mockCreateBatchSettlementPaymentRequirements).not.toHaveBeenCalled();
  });

  /** The price in the served document must be the price the 402 quotes. They are generated from
   *  one constant; this asserts the served copy did not get stale between build and deploy. */
  test("quotes the same prices in the spec as the routes charge", async () => {
    const res = await handle(discoveryEvent("GET", "openapi.json"), {});

    const spec = JSON.parse(res.body) as Record<
      string,
      Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>
    >;
    expect(spec["paths"]["/search"]["get"]["x-payment-info"]["price"]["amount"]).toBe("0.01");
    expect(spec["paths"]["/fetch"]["get"]["x-payment-info"]["price"]["amount"]).toBe("0.001");
  });

  test("serves the favicon as base64 on GET", async () => {
    const res = await handle(discoveryEvent("GET", "favicon.png"), {});

    expect(res.statusCode).toBe(200);
    expect(res.headers["Content-Type"]).toBe("image/jpeg");
    expect(res.isBase64Encoded).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  /** HEAD was a 404 before PR 3 — the dispatch accepted GET only. A crawler that probes with HEAD
   *  would have concluded the icon was absent. */
  test("answers HEAD for the favicon with headers but no body", async () => {
    const res = await handle(discoveryEvent("HEAD", "favicon.png"), {});

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("");
    expect(res.isBase64Encoded).toBe(false);
  });

  test("serves the discovery HTML at the root when the caller accepts HTML", async () => {
    const res = await handle(discoveryEvent("GET", "", { Accept: "text/html" }), {});

    expect(res.statusCode).toBe(200);
    expect(res.headers["Content-Type"]).toContain("text/html");
    expect(res.body).toContain('rel="icon"');
  });

  /** Only when HTML is asked for. A bare root request is not a browser or a crawler looking for an
   *  icon, and answering HTML to it would hide the fact that the root serves no API. */
  test("does not serve HTML at the root without an HTML Accept header", async () => {
    const res = await handle(discoveryEvent("GET", "", {}), {});

    expect(res.statusCode).toBe(404);
  });

  /** Discovery must not open a hole in the route check: an unknown path is still 404, and still
   *  without a price. */
  test("leaves the unknown-path 404 intact", async () => {
    const res = await handle(discoveryEvent("GET", "openapi.yaml"), {});

    expect(res.statusCode).toBe(404);
    expect(mockCreateBatchSettlementPaymentRequirements).not.toHaveBeenCalled();
  });
});

describe("the 402 challenge", () => {
  test.each([
    ["search", "10000"],
    ["fetch", "1000"],
  ])("quotes %s at %s atomic units", async (route, amount) => {
    const res = await handle(makeEvent("GET", route, { auth: null }), {});

    const { accepts } = JSON.parse(res.body) as { accepts: { amount: string }[] };
    expect(res.statusCode).toBe(402);
    expect(accepts.every((entry) => entry.amount === amount)).toBe(true);
  });

  /**
   * The seller identity that makes a tool call land on the channel the CHAT already funded.
   * `computeChannelId` hashes payer, payerAuthorizer, receiver, receiverAuthorizer, token,
   * withdrawDelay and salt — so sharing `createLLMResourceServer` and `NFT_WALLET_PUBLIC_KEY` with
   * `sc_llm_x402.ts` is the whole mechanism. Pay to a different address here and every visitor is
   * asked for a second on-chain deposit.
   */
  test("sells as the same receiver as the chat", async () => {
    const res = await handle(makeEvent("GET", "search", { auth: null }), {});
    const { accepts } = JSON.parse(res.body) as { accepts: { payTo: string }[] };

    expect(mockCreateLLMResourceServer).toHaveBeenCalledWith(RECEIVER);
    expect(accepts.every((entry) => entry.payTo === RECEIVER)).toBe(true);
  });

  /** Testnet USDC is free and both routes spend real money, so a testnet payment would buy
   *  metered Brave queries for nothing. */
  test("offers mainnet only", async () => {
    const res = await handle(makeEvent("GET", "search", { auth: null }), {});

    const { accepts } = JSON.parse(res.body) as { accepts: { network: string }[] };
    expect(accepts.map((entry) => entry.network).sort()).toEqual(["eip155:10", "eip155:8453"]);
  });

  test("quotes the route, not the query string, as the resource", async () => {
    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    const { resource } = JSON.parse(res.body) as { resource: { url: string } };
    expect(resource.url).toMatch(/\/search$/);
  });

  /** An unpaid request is quoted whatever its query says: a client probing for terms must not be
   *  told its query is malformed instead of being told the price. */
  test("quotes a price even when the query is invalid", async () => {
    const res = await handle(makeEvent("GET", "search", { auth: null, query: {} }), {});

    expect(res.statusCode).toBe(402);
  });
});

describe("the paid path", () => {
  beforeEach(() => {
    mockExtractPaymentPayload.mockReturnValue(payment());
  });

  test("serves and settles a valid payment", async () => {
    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(res.statusCode).toBe(200);
    expect(mockSettlePayment).toHaveBeenCalled();
    expect(res.headers["Payment-Response"]).toBe("encoded");
    expect(JSON.parse(res.body).results).toHaveLength(1);
  });

  /**
   * The lock TTL must be the same number in the quote and in the verification — the SDK treats it
   * as immutable across the pair, and a mismatch rejects the payment. It is NOT part of
   * `channelConfig`, which is why it may be shorter here than the chat's 120s.
   */
  test("verifies against the same maxTimeoutSeconds it advertised", async () => {
    mockExtractPaymentPayload.mockReturnValueOnce(null);
    const quote = await handle(makeEvent("GET", "search", { auth: null }), {});
    const { accepts } = JSON.parse(quote.body) as { accepts: { maxTimeoutSeconds: number }[] };

    await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    const verified = mockVerifyPayment.mock.calls[0][1] as { maxTimeoutSeconds: number };
    expect(verified.maxTimeoutSeconds).toBe(accepts[0].maxTimeoutSeconds);
  });

  /** The enhanced requirements carry receiverAuthorizer; the raw ones do not, and the facilitator
   *  reads a missing one as a mismatch rather than as "not required". */
  test("verifies against enhanced requirements", async () => {
    await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    const verified = mockVerifyPayment.mock.calls[0][1] as { extra: Record<string, unknown> };
    expect(verified.extra.receiverAuthorizer).toBe("0xauthorizer");
  });

  test("settles the same amount it verified", async () => {
    await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(mockSettlePayment.mock.calls[0][1]).toEqual(mockVerifyPayment.mock.calls[0][1]);
  });

  describe("paid in EURC", () => {
    const BASE_EURC = EURC_ADDRESSES["eip155:8453"];

    afterEach(() => {
      delete process.env.EUR_PER_USD;
    });

    test("prices the search in EURC at the converted, rounded-up amount", async () => {
      process.env.EUR_PER_USD = "0.86";
      mockExtractPaymentPayload.mockReturnValue(payment("eip155:8453", BASE_EURC));

      const res = await handle(
        makeEvent("GET", "search", { auth: null, query: { q: "x402" } }),
        {},
      );

      expect(res.statusCode).toBe(200);
      // 10000 USD-atomic × 0.86
      expect(mockVerifyPayment.mock.calls[0][1]).toMatchObject({
        asset: BASE_EURC,
        amount: "8600",
        extra: { name: "EURC", version: "2" },
      });
    });

    test("refuses EURC while EUR_PER_USD is unset", async () => {
      mockExtractPaymentPayload.mockReturnValue(payment("eip155:8453", BASE_EURC));

      const res = await handle(
        makeEvent("GET", "search", { auth: null, query: { q: "x402" } }),
        {},
      );

      expect(res.statusCode).toBe(402);
      expect(mockVerifyPayment).not.toHaveBeenCalled();
    });

    test("refuses EURC on a network where it does not exist", async () => {
      process.env.EUR_PER_USD = "0.86";
      mockExtractPaymentPayload.mockReturnValue(payment("eip155:10", BASE_EURC));

      const res = await handle(
        makeEvent("GET", "search", { auth: null, query: { q: "x402" } }),
        {},
      );

      expect(res.statusCode).toBe(402);
      expect(mockVerifyPayment).not.toHaveBeenCalled();
    });
  });

  /** An upstream failure is not something to charge for. */
  test("does not settle when Brave fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502, statusText: "Bad Gateway" }),
    );

    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(res.statusCode).toBe(500);
    expect(mockSettlePayment).not.toHaveBeenCalled();
  });

  /** Nor is a request we refused to attempt — and it is refused before the channel is touched. */
  test("does not verify a paid request whose query is invalid", async () => {
    const res = await handle(makeEvent("GET", "search", { auth: null, query: {} }), {});

    expect(res.statusCode).toBe(400);
    expect(mockVerifyPayment).not.toHaveBeenCalled();
  });

  /**
   * The url's scheme is checked without I/O, so it is checked before paying. Not for the money —
   * a rejected request never settles anyway — but for the lock: `verifyPayment` takes the
   * channel's `pendingRequest` lock, and a request that dies after it orphans that lock on the
   * channel the chat shares, stalling the user's next chat message for MAX_TIMEOUT_SECONDS.
   */
  test.each([
    ["an http url", "http://example.com/"],
    ["a file url", "file:///etc/passwd"],
    ["not a url at all", "certainly not a url"],
  ])("rejects %s before touching the channel", async (_label, url) => {
    const res = await handle(makeEvent("GET", "fetch", { auth: null, query: { url } }), {});

    expect(res.statusCode).toBe(400);
    expect(mockVerifyPayment).not.toHaveBeenCalled();
    expect(mockSettlePayment).not.toHaveBeenCalled();
  });

  test("does not settle a paid request for a private address", async () => {
    const res = await handle(
      makeEvent("GET", "fetch", { auth: null, query: { url: "https://169.254.169.254/" } }),
      {},
    );

    expect(res.statusCode).toBe(400);
    expect(mockSettlePayment).not.toHaveBeenCalled();
  });

  test("refuses a payment on a network it does not sell on", async () => {
    mockExtractPaymentPayload.mockReturnValue(payment("eip155:84532"));

    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(res.statusCode).toBe(402);
    expect(mockVerifyPayment).not.toHaveBeenCalled();
  });

  /** Through the SDK, so its corrective enrichment runs and the client can resync by itself. */
  test("answers a failed verification with the SDK's corrective 402", async () => {
    mockVerifyPayment.mockResolvedValue({ isValid: false, invalidReason: "channel_busy" });

    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(res.statusCode).toBe(402);
    expect(mockCreatePaymentRequiredResponse).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("answers 402 when settlement fails", async () => {
    mockSettlePayment.mockResolvedValue({
      success: false,
      errorReason: "cumulative_exceeds_balance",
    });

    const res = await handle(makeEvent("GET", "search", { auth: null, query: { q: "x402" } }), {});

    expect(res.statusCode).toBe(402);
    expect(JSON.parse(res.body).error).toMatch(/cumulative_exceeds_balance/);
  });

  /** A bearer no longer buys an exemption: a paid request carrying one is charged like any other,
   *  and the header is simply ignored. */
  test("charges a paying caller even when it also sends a bearer", async () => {
    const res = await handle(
      makeEvent("GET", "search", { auth: validAuth, query: { q: "x402" } }),
      {},
    );

    expect(res.statusCode).toBe(200);
    expect(mockVerifyPayment).toHaveBeenCalled();
    expect(mockSettlePayment).toHaveBeenCalled();
  });
});
