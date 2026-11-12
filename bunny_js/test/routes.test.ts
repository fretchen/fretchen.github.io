import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Kept only to build a genuinely valid owner bearer, which the "no free path" cases below send to
// prove it now buys nothing. Signing for real rather than mocking: `verifySignedMessage` resolves
// its own copy of viem through the symlinked workspace package, so a `vi.mock("viem")` here could
// never have reached it anyway — and a hand-faked token would not prove the point, since the thing
// being asserted is that even a CORRECT signature is ignored.
import { privateKeyToAccount } from "viem/accounts";
import { USDC_ADDRESSES, EURC_ADDRESSES } from "@fretchen/chain-utils";
import { TESTNET_MOCK_MARKER } from "../src/search_stand_in.js";

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
  mockReleaseLock,
  mockCreateResourceServer,
  mockExactVerifyPayment,
  mockExactSettlePayment,
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
  mockReleaseLock: vi.fn(),
  // The exact alternative's server (createResourceServer — no channels, no scheme object).
  mockCreateResourceServer: vi.fn(),
  mockExactVerifyPayment: vi.fn(),
  mockExactSettlePayment: vi.fn(),
}));

vi.mock("../src/x402_server.js", async () => {
  // The real registry — which asset is offered where is part of what these tests check, so
  // the exact-alternative helpers mirror the real implementation against it.
  const { USDC_ADDRESSES } = await import("@fretchen/chain-utils");
  const exactAlternativeEntry = (payTo: string) => ({
    scheme: "exact",
    network: "eip155:8453",
    amount: "10000",
    asset: USDC_ADDRESSES["eip155:8453"],
    payTo,
    maxTimeoutSeconds: 60,
    extra: { name: "USD Coin", version: "2" },
  });
  return {
    createLLMResourceServer: mockCreateLLMResourceServer,
    createBatchSettlementPaymentRequirements: mockCreateBatchSettlementPaymentRequirements,
    create402Response: mockCreate402Response,
    extractPaymentPayload: mockExtractPaymentPayload,
    createSettlementHeaders: mockCreateSettlementHeaders,
    releaseLock: mockReleaseLock,
    // Real values, as the routes import them.
    EXACT_ALTERNATIVE_NETWORK: "eip155:8453",
    EXACT_ALTERNATIVE_AMOUNT_ATOMIC: "10000",
    // Real value (x402_server.ts's batch networks — mainnets plus the testnet mock path).
    getBatchSettlementNetworks: () => ["eip155:10", "eip155:8453", "eip155:84532"],
    // Real implementation (pure bigint math, no side effects) — keep in sync with
    // x402_server.ts's actual formatUsdcAtomicAsDecimalUsd.
    formatUsdcAtomicAsDecimalUsd: (atomicAmount: string) => {
      const atomic = BigInt(atomicAmount);
      const divisor = 1_000_000n;
      const whole = atomic / divisor;
      const fraction = (atomic % divisor).toString().padStart(6, "0");
      const trimmedFraction = fraction.replace(/0+$/, "");
      return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString();
    },
    // Real semantics, EURe-first as the production preference orders it: every token priced
    // in its own units, so the page can never quote fewer tokens than the challenge.
    formatParallelPrices: (price: { EURe: string; EURC: string; USDC: string }) => {
      const fmt = (atomic: string, decimals: bigint, symbol: "EURe" | "EURC" | "USDC") =>
        `${symbol === "USDC" ? "$" : "€"}${(() => {
          const a = BigInt(atomic);
          const div = 10n ** decimals;
          const whole = a / div;
          const frac = (a % div).toString().padStart(Number(decimals), "0").replace(/0+$/, "");
          return frac ? `${whole}.${frac}` : whole.toString();
        })()} in ${symbol}`;
      return `${fmt(price.EURe, 18n, "EURe")}, ${fmt(price.EURC, 6n, "EURC")}, ${fmt(price.USDC, 6n, "USDC")}`;
    },
    // Real semantics for the pure helpers — the tests below pin the entry they produce.
    createExactAlternative: exactAlternativeEntry,
    withExactAlternative: (challenge: { accepts: unknown[] }, payTo: string) => ({
      ...challenge,
      accepts: [...(challenge.accepts ?? []), exactAlternativeEntry(payTo)],
    }),
    createResourceServer: mockCreateResourceServer,
  };
});

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

const ORIGIN = "https://web-agent.fretchen.eu";

/** The native twin of the original makeEvent: a web-standard Request. */
function makeRequest(
  method: string,
  path: string,
  options: { auth?: string | null; query?: Record<string, string> } = {},
) {
  const auth = options.auth === null ? undefined : options.auth;
  const qs = options.query ? `?${new URLSearchParams(options.query).toString()}` : "";
  return new Request(`${ORIGIN}/${path}${qs}`, {
    method,
    headers: auth ? { Authorization: auth } : {},
  });
}

/** Discovery requests carry arbitrary headers, not an auth bearer. */
function discoveryRequest(method: string, path: string, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}/${path}`, { method, headers });
}

/**
 * Legacy view over the native Response, so the assertions ported from scw_js's suite stay
 * shape-identical: statusCode, a flat lowercase headers map, and the body as text.
 */
async function handle(request: Request) {
  const res = await handleRequest(request);
  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return { statusCode: res.status, headers, body: await res.text() };
}

let handleRequest: typeof import("../src/searchapi_routes.js").handleRequest;
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
      price: { USDC: string; EURC: string };
      payTo: string;
      networks: string[];
      maxTimeoutSeconds: number;
    }) => ({
      x402Version: 2,
      resource: { url: opts.resourceUrl },
      accepts: opts.networks.map((network) => ({
        network,
        amount: opts.price.USDC,
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
  // The exact alternative's server: same shapes, its own mocks, so the two schemes' call
  // paths can be asserted apart.
  mockCreateResourceServer.mockImplementation(() => ({
    verifyPayment: mockExactVerifyPayment,
    settlePayment: mockExactSettlePayment,
  }));
  mockExactVerifyPayment.mockResolvedValue({ isValid: true, payer: "0xpayer" });
  mockExactSettlePayment.mockResolvedValue({
    success: true,
    transaction: "",
    network: "eip155:8453",
  });
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
  handleRequest = (await import("../src/searchapi_routes.js")).handleRequest;
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
    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(402);
  });

  /**
   * The regression guard for this change. A token that used to be served for free — correctly
   * signed, current, right prefix, right owner — must now be quoted a price like anything else,
   * and must not reach the metered upstream on the way.
   */
  test("quotes a price even for what used to be a valid owner token", async () => {
    const res = await handle(
      makeRequest("GET", "search", { auth: validAuth, query: { q: "x402" } }),
    );

    expect(res.statusCode).toBe(402);
    expect(fetch).not.toHaveBeenCalled();
  });

  /** OWNER_ETH_ADDRESS is no longer read by this endpoint at all; setting it buys nobody a
   *  free call. It stays in the environment for growthapi and analytics. */
  test("serves nobody free even when OWNER_ETH_ADDRESS names the signer", async () => {
    process.env.OWNER_ETH_ADDRESS = OWNER_ADDRESS;

    const res = await handle(
      makeRequest("GET", "search", { auth: validAuth, query: { q: "x402" } }),
    );

    expect(res.statusCode).toBe(402);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("never calls Brave when the caller has not paid", async () => {
    await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("OPTIONS preflight", () => {
  test("returns 200 without auth or payment", async () => {
    const res = await handle(makeRequest("OPTIONS", "search", { auth: null }));

    expect(res.statusCode).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("*");
    expect(res.headers["access-control-allow-methods"]).toContain("GET");
  });

  /** The bunny twin sits behind a pull zone (a real CDN); anything cached here would replay
   *  a purchased result — with its Payment-Response receipt — to the next caller. */
  test("sends Cache-Control: no-store on every response", async () => {
    const res = await handle(makeRequest("OPTIONS", "search", { auth: null }));
    expect(res.headers["cache-control"]).toBe("no-store");

    const unpaid = await handle(makeRequest("GET", "search", { auth: null }));
    expect(unpaid.statusCode).toBe(402);
    expect(unpaid.headers["cache-control"]).toBe("no-store");

    mockExtractPaymentPayload.mockReturnValue(payment());
    const paid = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));
    expect(paid.statusCode).toBe(200);
    expect(paid.headers["cache-control"]).toBe("no-store");
  });

  /** Both directions, and they are unrelated despite the similar names: the payment header must be
   *  allowed on the request, and the settlement header must be readable on the response. Without
   *  the second, a browser buyer's channel record goes stale and it re-deposits every call. */
  test("allows the payment header and exposes the settlement header", async () => {
    const res = await handle(makeRequest("OPTIONS", "search", { auth: null }));

    expect(res.headers["access-control-allow-headers"]).toContain("PAYMENT-SIGNATURE");
    expect(res.headers["access-control-expose-headers"]).toContain("Payment-Response");
  });

  /**
   * `Authorization` is deliberately NOT named any more. It had to be, while the owner bearer was a
   * way in — it is the one header a `*` wildcard does not cover. With that path gone the endpoint
   * is payment-only like `genimg` and `llmx402`, and the shared `CORS_HEADERS` is the honest
   * description of what it accepts. Asserted rather than left implicit, because silently
   * re-widening the preflight is how a removed auth path grows back.
   */
  test("does not advertise Authorization, which nothing sends any more", async () => {
    const res = await handle(makeRequest("OPTIONS", "search", { auth: null }));

    expect(res.headers["access-control-allow-headers"]).not.toContain("Authorization");
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
    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      results: [{ url: "https://example.com/0", title: "Result 0", text: "A snippet." }],
    });
  });

  /** The caller must not be able to buy itself more context than the proxy budgets for. */
  test("pins the cost knobs whatever the caller passes", async () => {
    await handle(
      makeRequest("GET", "search", {
        auth: null,
        query: {
          q: "x402",
          maximum_number_of_tokens: "32768",
          count: "50",
          maximum_number_of_urls: "50",
        },
      }),
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
    const res = await handle(makeRequest("GET", "search", { auth: null, query }));

    expect(res.statusCode).toBe(400);
  });

  test("answers 500 without detail when Brave fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: "Too Many Requests" }),
    );

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

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
      makeRequest("GET", "fetch", { auth: null, query: { url: "https://example.com/" } }),
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
      makeRequest("GET", "fetch", { auth: null, query: { url: "https://example.com/" } }),
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
    const res = await handle(makeRequest("GET", "fetch", { auth: null, query }));

    expect(res.statusCode).toBe(400);
  });
});

describe("routing", () => {
  test.each([
    ["an unknown path", "GET", "elsewhere"],
    ["the wrong method", "POST", "search"],
  ])("answers 404 for %s", async (_label, method, path) => {
    const res = await handle(makeRequest(method, path, { auth: validAuth, query: { q: "x402" } }));

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error).toBe("Not found");
  });

  /** A resource that does not exist has no price — quoting one would advertise a route that
   *  answers 404 the moment it is paid for. */
  test("answers 404 for an unknown path without quoting a price", async () => {
    const res = await handle(makeRequest("GET", "elsewhere", { auth: null }));

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
  test("serves the ERC-8004 registration file, unpaid, and an empty body on HEAD", async () => {
    const res = await handle(discoveryRequest("GET", ".well-known/agent-registration.json"));
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/json");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
    const file = JSON.parse(res.body) as { services: { name: string; endpoint: string }[] };
    expect(file.services[0].endpoint).toBe("https://web-agent.fretchen.eu/openapi.json");
    // The offchain agentWallet is the same payTo the 402 quotes.
    expect(file.services).toContainEqual({
      name: "agentWallet",
      endpoint: `eip155:8453:${RECEIVER}`,
    });
    expect(mockCreateBatchSettlementPaymentRequirements).not.toHaveBeenCalled();

    const head = await handle(discoveryRequest("HEAD", ".well-known/agent-registration.json"));
    expect(head.statusCode).toBe(200);
    expect(head.body).toBe("");
  });

  test("serves the machine-readable OASF record the registration file points at", async () => {
    const res = await handle(discoveryRequest("GET", ".well-known/oasf.json"));
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/json");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
    const record = JSON.parse(res.body);
    expect(record.schema_version).toBe("0.8.0");
    expect(record.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(record.skills).toContainEqual({
      name: "natural_language_processing/information_retrieval_synthesis/search",
      id: 10306,
    });

    const head = await handle(discoveryRequest("HEAD", ".well-known/oasf.json"));
    expect(head.statusCode).toBe(200);
    expect(head.body).toBe("");
  });

  test("serves the generated spec, unpaid and unauthenticated", async () => {
    const res = await handle(discoveryRequest("GET", "openapi.json"));

    expect(res.statusCode).toBe(200);
    const spec = JSON.parse(res.body) as Record<string, unknown>;
    expect(spec["openapi"]).toBe("3.1.0");
    expect(spec["x-service-type"]).toBe("web/v1");
    expect(mockCreateBatchSettlementPaymentRequirements).not.toHaveBeenCalled();
  });

  /** The price in the served document must be the price the 402 quotes. They are generated from
   *  one constant; this asserts the served copy did not get stale between build and deploy. */
  test("quotes the same prices in the spec as the routes charge", async () => {
    const res = await handle(discoveryRequest("GET", "openapi.json"));

    const spec = JSON.parse(res.body) as Record<
      string,
      Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>
    >;
    expect(spec["paths"]["/search"]["get"]["x-payment-info"]["price"]["amount"]).toBe("0.01");
    expect(spec["paths"]["/fetch"]["get"]["x-payment-info"]["price"]["amount"]).toBe("0.001");
  });

  /** The Scaleway twin served base64 + isBase64Encoded; the native edge serves raw bytes. */
  test("serves the favicon as bytes on GET", async () => {
    const res = await handleRequest(discoveryRequest("GET", "favicon.png"));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  /** HEAD was a 404 before PR 3 — the dispatch accepted GET only. A crawler that probes with HEAD
   *  would have concluded the icon was absent. */
  test("answers HEAD for the favicon with headers but no body", async () => {
    const res = await handleRequest(discoveryRequest("HEAD", "favicon.png"));

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
  });

  /** The root page is the agent-facing README, served unconditionally — agents send
   *  "Accept: star-slash" too, so gating on text/html hid the whole page from the reader
   *  it is for. x402scan still gets its <link rel="icon"> first. */
  test("serves the agent-facing root page at the origin root, regardless of the Accept header", async () => {
    const headerCases: Record<string, string>[] = [{}, { Accept: "*/*" }, { Accept: "text/html" }];
    for (const headers of headerCases) {
      const res = await handle(discoveryRequest("GET", "", headers));

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
      // x402scan parses <link rel="icon"> from this document — it must stay first.
      expect(res.body.indexOf('rel="icon"')).toBeLessThan(res.body.indexOf("<title>"));
      expect(res.body).toContain("/favicon.png");
      // The page title is the spec's — pinned so a title change updates this test.
      expect(res.body).toContain("Fretchen Web Retrieval");
      expect(res.body).toContain("/openapi.json");
      expect(res.body).toContain(".well-known/agent-registration.json");
      expect(res.body).toContain(".well-known/oasf.json");
      expect(res.body).toContain("https://mcp-agent.fretchen.eu/mcp");
      // Prices on the page are generated from PRICE_ATOMIC — every accepted token in its
      // own units, EURe first as the seller's preference orders it — plus the flat exact
      // alternative; never a single-token restatement.
      expect(res.body).toContain(
        "GET /search — channel call: €0.01 in EURe, €0.01 in EURC, $0.01 in USDC; or exact: $0.01 flat (USDC, Base mainnet)",
      );
      expect(res.body).toContain(
        "GET /fetch — channel call: €0.001 in EURe, €0.001 in EURC, $0.001 in USDC; or exact: $0.01 flat (USDC, Base mainnet)",
      );
      expect(res.body).toContain("curl 'https://web-agent.fretchen.eu/search?q=erc-8004'");
      expect(res.body).toContain("402");
      expect(mockCreateBatchSettlementPaymentRequirements).not.toHaveBeenCalled();
    }
  });

  /** Discovery must not open a hole in the route check: an unknown path is still 404, and still
   *  without a price. */
  test("leaves the unknown-path 404 intact", async () => {
    const res = await handle(discoveryRequest("GET", "openapi.yaml"));

    expect(res.statusCode).toBe(404);
    expect(mockCreateBatchSettlementPaymentRequirements).not.toHaveBeenCalled();
  });
});

describe("the 402 challenge", () => {
  test.each([
    ["search", "10000"],
    ["fetch", "1000"],
  ])("quotes %s at %s atomic units", async (route, amount) => {
    const res = await handle(makeRequest("GET", route, { auth: null }));

    const { accepts } = JSON.parse(res.body) as {
      accepts: { amount: string; scheme?: string }[];
    };
    expect(res.statusCode).toBe(402);
    // The route's own price applies to every entry except the exact alternative (whose
    // flat per-call price is pinned in its own test below).
    const routeEntries = accepts.filter((entry) => entry.scheme !== "exact");
    expect(routeEntries.length).toBeGreaterThan(0);
    expect(routeEntries.every((entry) => entry.amount === amount)).toBe(true);
  });

  /**
   * The seller identity that makes a tool call land on the channel the CHAT already funded.
   * `computeChannelId` hashes payer, payerAuthorizer, receiver, receiverAuthorizer, token,
   * withdrawDelay and salt — so sharing `createLLMResourceServer` and `NFT_WALLET_PUBLIC_KEY` with
   * `sc_llm_x402.ts` is the whole mechanism. Pay to a different address here and every visitor is
   * asked for a second on-chain deposit.
   */
  test("sells as the same receiver as the chat", async () => {
    const res = await handle(makeRequest("GET", "search", { auth: null }));
    const { accepts } = JSON.parse(res.body) as { accepts: { payTo: string }[] };

    expect(mockCreateLLMResourceServer).toHaveBeenCalledWith(RECEIVER);
    expect(accepts.every((entry) => entry.payTo === RECEIVER)).toBe(true);
  });

  /** Testnet USDC is free and both routes spend real money, so a testnet payment would buy
   *  metered Brave queries for nothing. The exact alternative is Base MAINNET — it joins the
   * mainnet-only fold rather than widening it. */
  test("offers the batch networks: mainnets plus the testnet mock path", async () => {
    const res = await handle(makeRequest("GET", "search", { auth: null }));

    const { accepts } = JSON.parse(res.body) as { accepts: { network: string; scheme?: string }[] };
    expect(
      accepts
        .filter((entry) => entry.scheme !== "exact")
        .map((entry) => entry.network)
        .sort(),
    ).toEqual(["eip155:10", "eip155:8453", "eip155:84532"]);
    expect(
      accepts.every(
        (entry) =>
          entry.network === "eip155:10" ||
          entry.network === "eip155:8453" ||
          entry.network === "eip155:84532",
      ),
    ).toBe(true);
  });

  test("quotes the route, not the query string, as the resource", async () => {
    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    const { resource } = JSON.parse(res.body) as { resource: { url: string } };
    // The full production origin from the committed spec — never a serving origin (a leftover
    // trial env once advertised the *.bunny.run URL here, which indexers could not attribute).
    expect(resource.url).toBe("https://web-agent.fretchen.eu/search");
  });

  /** One bazaar block per route (docs.x402.org/extensions/bazaar): the block names the method
   *  and the query parameters, and the two routes sell different things at different prices. */
  test("declares a per-route bazaar block with the service metadata", async () => {
    await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));
    await handle(
      makeRequest("GET", "fetch", { auth: null, query: { url: "https://example.com/" } }),
    );

    const searchOpts = mockCreateBatchSettlementPaymentRequirements.mock.calls[0][0] as {
      extensions: {
        bazaar: { info: { input: { method: string; queryParams: Record<string, unknown> } } };
      };
      serviceName: string;
      tags: string[];
      iconUrl: string;
    };
    const fetchOpts = mockCreateBatchSettlementPaymentRequirements.mock
      .calls[1][0] as typeof searchOpts;

    expect(searchOpts.extensions.bazaar.info.input.method).toBe("GET");
    expect(Object.keys(searchOpts.extensions.bazaar.info.input.queryParams)).toEqual(["q"]);
    expect(fetchOpts.extensions.bazaar.info.input.method).toBe("GET");
    expect(Object.keys(fetchOpts.extensions.bazaar.info.input.queryParams)).toEqual(["url"]);
    for (const opts of [searchOpts, fetchOpts]) {
      expect(opts.serviceName).toBe("Fretchen Web Retrieval");
      expect(opts.tags).toEqual(["search", "web", "x402"]);
      expect(opts.iconUrl).toBe("https://web-agent.fretchen.eu/favicon.png");
    }
  });

  /** An unpaid request is quoted whatever its query says: a client probing for terms must not be
   *  told its query is malformed instead of being told the price. */
  test("quotes a price even when the query is invalid", async () => {
    const res = await handle(makeRequest("GET", "search", { auth: null, query: {} }));

    expect(res.statusCode).toBe(402);
  });
});

describe("the paid path", () => {
  beforeEach(() => {
    mockExtractPaymentPayload.mockReturnValue(payment());
  });

  test("serves and settles a valid payment", async () => {
    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(200);
    expect(mockSettlePayment).toHaveBeenCalled();
    expect(res.headers["payment-response"]).toBe("encoded");
    expect(JSON.parse(res.body).results).toHaveLength(1);
  });

  /**
   * The lock TTL must be the same number in the quote and in the verification — the SDK treats it
   * as immutable across the pair, and a mismatch rejects the payment. It is NOT part of
   * `channelConfig`, which is why it may be shorter here than the chat's 120s.
   */
  test("verifies against the same maxTimeoutSeconds it advertised", async () => {
    mockExtractPaymentPayload.mockReturnValueOnce(null);
    const quote = await handle(makeRequest("GET", "search", { auth: null }));
    const { accepts } = JSON.parse(quote.body) as { accepts: { maxTimeoutSeconds: number }[] };

    await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    const verified = mockVerifyPayment.mock.calls[0][1] as { maxTimeoutSeconds: number };
    expect(verified.maxTimeoutSeconds).toBe(accepts[0].maxTimeoutSeconds);
  });

  /** The enhanced requirements carry receiverAuthorizer; the raw ones do not, and the facilitator
   *  reads a missing one as a mismatch rather than as "not required". */
  test("verifies against enhanced requirements", async () => {
    await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    const verified = mockVerifyPayment.mock.calls[0][1] as { extra: Record<string, unknown> };
    expect(verified.extra.receiverAuthorizer).toBe("0xauthorizer");
  });

  test("settles the same amount it verified", async () => {
    await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(mockSettlePayment.mock.calls[0][1]).toEqual(mockVerifyPayment.mock.calls[0][1]);
  });

  describe("paid in EURC", () => {
    const BASE_EURC = EURC_ADDRESSES["eip155:8453"];

    // Search costs 0.01 in both lists today, so a test with the real values could not tell which
    // list was read. Give EURC a distinct price for the duration of the test. Imported here, after
    // the outer beforeEach's resetModules + handler import, so it is the instance the handler reads.
    beforeEach(async () => {
      const { PRICE_ATOMIC } = await import("../src/search_schemas.js");
      PRICE_ATOMIC.search.EURC = "9000";
    });

    test("prices the search from the EURC price list", async () => {
      mockExtractPaymentPayload.mockReturnValue(payment("eip155:8453", BASE_EURC));

      const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

      expect(res.statusCode).toBe(200);
      expect(mockVerifyPayment.mock.calls[0][1]).toMatchObject({
        asset: BASE_EURC,
        amount: "9000",
        extra: { name: "EURC", version: "2" },
      });
    });

    test("refuses EURC on a network where it does not exist", async () => {
      mockExtractPaymentPayload.mockReturnValue(payment("eip155:10", BASE_EURC));

      const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

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

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(500);
    expect(mockSettlePayment).not.toHaveBeenCalled();
    // Verified but unsettled: the channel lock is released, not left to block the next message.
    expect(mockReleaseLock).toHaveBeenCalledOnce();
  });

  /** Nor is a request we refused to attempt — and it is refused before the channel is touched. */
  test("does not verify a paid request whose query is invalid", async () => {
    const res = await handle(makeRequest("GET", "search", { auth: null, query: {} }));

    expect(res.statusCode).toBe(400);
    expect(mockVerifyPayment).not.toHaveBeenCalled();
  });

  /**
   * The url's scheme is checked without I/O, so it is checked before paying. Not for the money —
   * a rejected request never settles anyway — but for the lock: `verifyPayment` takes the
   * channel's pendingRequest lock, and a request that dies after it orphans that lock on the
   * channel the chat shares, stalling the user's next chat message for MAX_TIMEOUT_SECONDS.
   */
  test.each([
    ["an http url", "http://example.com/"],
    ["a file url", "file:///etc/passwd"],
    ["not a url at all", "certainly not a url"],
  ])("rejects %s before touching the channel", async (_label, url) => {
    const res = await handle(makeRequest("GET", "fetch", { auth: null, query: { url } }));

    expect(res.statusCode).toBe(400);
    expect(mockVerifyPayment).not.toHaveBeenCalled();
    expect(mockSettlePayment).not.toHaveBeenCalled();
  });

  /**
   * The failure that ended real research turns: a fetch rejected after verify (here the private
   * address, found only by resolving the name) returns a quiet 400. The lock that verify took must
   * be released, or the user's next chat message on the shared channel gets `channel_busy`.
   */
  test("does not settle a paid request for a private address, and releases the lock", async () => {
    const res = await handle(
      makeRequest("GET", "fetch", { auth: null, query: { url: "https://169.254.169.254/" } }),
    );

    expect(res.statusCode).toBe(400);
    expect(mockSettlePayment).not.toHaveBeenCalled();
    expect(mockReleaseLock).toHaveBeenCalledOnce();
  });

  /**
   * A page that never answers is the caller's choice of url, not our failure: the caller gets a
   * 400 that names the host, is not charged, and nothing pages us. On 2026-10-04 this was a 500
   * "Internal server error" and a ServicesNeedAttention alert.
   */
  test("explains a page that timed out, charges nothing, and does not alert", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError")),
    );
    // The instance routes.ts logs through: beforeEach reset the registry before importing it.
    const { logger } = await import("../src/logger.js");
    const errorLog = vi.spyOn(logger, "error");

    const res = await handle(
      makeRequest("GET", "fetch", { auth: null, query: { url: "https://slow.example/" } }),
    );

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("Could not reach slow.example: no response within 8 s");
    expect(mockSettlePayment).not.toHaveBeenCalled();
    expect(mockReleaseLock).toHaveBeenCalledOnce();
    expect(errorLog).not.toHaveBeenCalled();
  });

  test("does not release a lock on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => braveResponse() }),
    );

    await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(mockReleaseLock).not.toHaveBeenCalled();
  });

  test("refuses a payment on a network it does not sell on", async () => {
    // Optimism Sepolia: in no network list here — not batch (no contract deployment there)
    // and not the exact alternative (Base mainnet only). The refusal stays a plain 402.
    mockExtractPaymentPayload.mockReturnValue(payment("eip155:11155420"));

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(402);
    expect(mockVerifyPayment).not.toHaveBeenCalled();
  });

  /** Through the SDK, so its corrective enrichment runs and the client can resync by itself. */
  test("answers a failed verification with the SDK's corrective 402", async () => {
    mockVerifyPayment.mockResolvedValue({ isValid: false, invalidReason: "channel_busy" });

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(402);
    expect(mockCreatePaymentRequiredResponse).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("answers 402 when settlement fails", async () => {
    mockSettlePayment.mockResolvedValue({
      success: false,
      errorReason: "cumulative_exceeds_balance",
    });

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(402);
    expect(JSON.parse(res.body).error).toMatch(/cumulative_exceeds_balance/);
  });

  /** A bearer no longer buys an exemption: a paid request carrying one is charged like any other,
   *  and the header is simply ignored. */
  test("charges a paying caller even when it also sends a bearer", async () => {
    const res = await handle(
      makeRequest("GET", "search", { auth: validAuth, query: { q: "x402" } }),
    );

    expect(res.statusCode).toBe(200);
    expect(mockVerifyPayment).toHaveBeenCalled();
    expect(mockSettlePayment).toHaveBeenCalled();
  });
});

/**
 * The exact alternative: the accepts entry appended AFTER the batch-settlement entries —
 * one EIP-3009 signature per call, flat $0.01 USDC on Base mainnet, no channels. It exists
 * for stock x402 clients that cannot open channels at all.
 */
describe("the exact alternative", () => {
  const exactPayload = {
    accepted: {
      scheme: "exact",
      network: "eip155:8453",
      asset: USDC_ADDRESSES["eip155:8453"],
    },
    payload: { transferWithAuthorization: "0xsigned" },
  };

  /** One accepts entry, appended last, exact terms; the batch entries stay untouched ahead
   *  of it — the ordering IS the contract (channel buyers read their entries first). */
  test("appends one exact entry after the batch-settlement entries", async () => {
    for (const route of ["search", "fetch"] as const) {
      const res = await handle(makeRequest("GET", route, { auth: null }));

      const { accepts } = JSON.parse(res.body) as {
        accepts: Record<string, unknown>[];
      };
      const exactEntries = accepts.filter((entry) => entry["scheme"] === "exact");
      expect(exactEntries).toHaveLength(1);
      expect(accepts[accepts.length - 1]["scheme"]).toBe("exact");
      expect(exactEntries[0]).toEqual({
        scheme: "exact",
        network: "eip155:8453",
        amount: "10000",
        asset: USDC_ADDRESSES["eip155:8453"],
        payTo: RECEIVER,
        maxTimeoutSeconds: 60,
        extra: { name: "USD Coin", version: "2" },
      });
    }
  });

  test("serves and settles an exact payment without touching channel machinery", async () => {
    mockExtractPaymentPayload.mockReturnValue(exactPayload);

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(200);
    // The exact server, for both payment steps; the batch server is never built.
    expect(mockCreateResourceServer).toHaveBeenCalledOnce();
    expect(mockExactVerifyPayment).toHaveBeenCalledTimes(1);
    expect(mockExactVerifyPayment).toHaveBeenCalledWith(
      exactPayload,
      expect.objectContaining({
        scheme: "exact",
        network: "eip155:8453",
        amount: "10000",
        asset: USDC_ADDRESSES["eip155:8453"],
        payTo: RECEIVER,
        maxTimeoutSeconds: 60,
      }),
    );
    // Flat price: settle verifies and settles the same amount (no metering, no enhancement).
    expect(mockExactSettlePayment).toHaveBeenCalledTimes(1);
    expect((mockExactSettlePayment.mock.calls[0] as unknown[])[1]).toEqual(
      expect.objectContaining({ scheme: "exact", amount: "10000" }),
    );
    expect(res.headers["payment-response"]).toBe("encoded");
    // None of the channel pipeline may run.
    expect(mockCreateLLMResourceServer).not.toHaveBeenCalled();
    expect(mockEnhancePaymentRequirements).not.toHaveBeenCalled();
    expect(mockVerifyPayment).not.toHaveBeenCalled();
    expect(mockSettlePayment).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1); // the paid Brave call did run
  });

  test("rejects an exact payment on network terms it never offered", async () => {
    mockExtractPaymentPayload.mockReturnValue({
      accepted: {
        scheme: "exact",
        network: "eip155:10", // Optimism USDC — offered for batch-settlement, never for exact
        asset: USDC_ADDRESSES["eip155:10"],
      },
      payload: { transferWithAuthorization: "0xsigned" },
    });

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(402);
    expect(mockExactVerifyPayment).not.toHaveBeenCalled();
    expect(mockExactSettlePayment).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("answers an invalid exact payment with a plain 402, not the batch corrective", async () => {
    mockExtractPaymentPayload.mockReturnValue(exactPayload);
    mockExactVerifyPayment.mockResolvedValue({ isValid: false, invalidReason: "expired" });

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(402);
    expect(JSON.parse(res.body).error).toMatch(/expired/);
    // No channel state to resync — so no SDK corrective and no advert of the failed payment.
    expect(mockCreatePaymentRequiredResponse).not.toHaveBeenCalled();
    expect(mockExactSettlePayment).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("does not settle an exact payment when the upstream fails", async () => {
    mockExtractPaymentPayload.mockReturnValue(exactPayload);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502, statusText: "Bad Gateway" }),
    );

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(500);
    expect(mockExactSettlePayment).not.toHaveBeenCalled();
    // Exact holds no lock, so the batch path's lock release must not run either.
    expect(mockReleaseLock).not.toHaveBeenCalled();
  });
});

/**
 * The testnet stand-in: a paid request on Base Sepolia runs the FULL x402 machinery —
 * challenge, validation, channel verify, settle-on-success, the Payment-Response header —
 * but answers with the marked stand-in (search_stand_in.ts) instead of the metered
 * upstreams. The invariant is one-sided and absolute: testnet money (free) must never
 * buy Brave queries or /fetch egress; mainnet money must always get the real thing.
 */
describe("the testnet stand-in", () => {
  beforeEach(() => {
    mockExtractPaymentPayload.mockReturnValue(payment("eip155:84532"));
  });

  test("serves and settles a paid /search with the marked stand-in, upstream untouched", async () => {
    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(200);
    expect(mockVerifyPayment).toHaveBeenCalledTimes(1);
    expect(mockSettlePayment).toHaveBeenCalledTimes(1);
    expect(res.headers["payment-response"]).toBe("encoded");
    // The security invariant: testnet money never reaches Brave.
    expect(fetch).not.toHaveBeenCalled();

    const body = JSON.parse(res.body) as {
      results: { title: string; text: string; url: string }[];
    };
    expect(body.results).toHaveLength(3);
    for (const result of body.results) {
      expect(result.title).toContain(TESTNET_MOCK_MARKER);
      expect(result.url).toContain("web-agent.fretchen.eu");
    }
    // Echo: the caller's own query arrives in the stand-in answer.
    expect(body.results[0].title).toContain("x402");
  });

  test("serves and settles a paid /fetch with the marked stand-in, upstream untouched", async () => {
    const res = await handle(
      makeRequest("GET", "fetch", { auth: null, query: { url: "https://example.com/" } }),
    );

    expect(res.statusCode).toBe(200);
    expect(mockVerifyPayment).toHaveBeenCalledTimes(1);
    expect(mockSettlePayment).toHaveBeenCalledTimes(1);
    expect(res.headers["payment-response"]).toBe("encoded");
    // The security invariant: testnet money never triggers egress.
    expect(fetch).not.toHaveBeenCalled();

    const body = JSON.parse(res.body) as { finalUrl: string; html: string; contentType: string };
    expect(body.finalUrl).toBe("https://example.com/");
    expect(body.html).toContain(TESTNET_MOCK_MARKER);
    expect(body.html).toContain("no real web"); // loud it is
  });

  /** The other side of the invariant, pinned where it is defined: the same caller, the same
   *  route, only the network flipped — and the metered upstream runs. */
  test("flips back to the real upstream for a mainnet payment", async () => {
    mockExtractPaymentPayload.mockReturnValue(payment("eip155:10"));

    const res = await handle(makeRequest("GET", "search", { auth: null, query: { q: "x402" } }));

    expect(res.statusCode).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1); // the paid Brave call did run
    expect(JSON.stringify(res.body)).not.toContain(TESTNET_MOCK_MARKER);
  });
});
