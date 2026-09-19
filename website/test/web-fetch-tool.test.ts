/**
 * `tools/webFetch.ts` reuses `extractPageText`/`selectPage` wholesale, which have their own
 * coverage in `page-tool.test.ts`. What is tested here is only this module's own contribution:
 * the thin url guard, the envelope check, the substituted no-prose wording, and that the result
 * is keyed on where the content actually came from rather than where it was asked for.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchViaProxy, selectFetched, normalizeFetchUrl, fetchUrlTool } from "../tools/webFetch";
import { TOOL_REGISTRY } from "../components/AssistantChat";

afterEach(() => {
  vi.unstubAllGlobals();
});

function envelope(html: string, finalUrl = "https://example.com/post") {
  return { finalUrl, html, contentType: "text/html" };
}

function article(body: string) {
  return `<html><head><title>A Post | Example</title></head><body><main><article>${body}</article></main></body></html>`;
}

const LONG = "<p>" + "Real prose that clears the two-hundred-character floor. ".repeat(10) + "</p>";

describe("normalizeFetchUrl", () => {
  it.each([
    ["https://example.com/a", "https://example.com/a"],
    ["  https://example.com/a  ", "https://example.com/a"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeFetchUrl(input)).toBe(expected);
  });

  // The server's guard is the one that counts; this only saves a round trip on the obvious cases.
  it.each([
    ["http", "http://example.com/"],
    ["file", "file:///etc/passwd"],
    ["javascript", "javascript:alert(1)"],
    ["a relative path", "/etc/passwd"],
    ["empty", "   "],
    ["a non-string", 42],
  ])("rejects %s", (_label, input) => {
    expect(normalizeFetchUrl(input)).toBeNull();
  });
});

describe("selectFetched", () => {
  it("extracts the page and reports its outline", () => {
    const result = selectFetched(envelope(article(`<h2>First</h2>${LONG}<h2>Second</h2>${LONG}`)), undefined) as Record<
      string,
      unknown
    >;

    expect(result.status).toBe("ok");
    expect(result.outline).toEqual(["First", "Second"]);
    expect(result.title).toBe("A Post");
  });

  it("keys the result on the final url, not the one that was requested", () => {
    // After a redirect the two differ, and this is the one the model cites.
    const result = selectFetched(envelope(article(LONG), "https://example.com/redirected-here"), undefined) as Record<
      string,
      unknown
    >;

    expect(result.url).toBe("https://example.com/redirected-here");
  });

  it("slices a named section", () => {
    const html = article(`<h2>Setup</h2>${LONG}<h2>Usage</h2><p>Run it.</p>`);

    const result = selectFetched(envelope(html), "Usage") as Record<string, unknown>;

    expect(result.content).toContain("Run it.");
    expect(result.content).not.toContain("Real prose");
  });

  /** The reason `selectPage` grew a hint parameter: a stranger's empty page is empty for
   *  different reasons than one of ours, and the model's next move follows from the wording. */
  it("explains an empty page in fetch terms, not in this site's terms", () => {
    const result = selectFetched(envelope(article("<p></p>")), undefined) as Record<string, unknown>;

    expect(result.status).toBe("no_prose");
    expect(result.hint).toMatch(/javascript|paywall|consent/i);
    expect(result.hint).not.toMatch(/index page|this tool returns/i);
  });

  /** This site's 200-character floor is measured against this site. A stranger's short page was
   *  fetched perfectly well, and reporting it as a paywall discards it. */
  it("returns a short foreign page instead of calling it empty", () => {
    const result = selectFetched(envelope(article("<p>Yes, since 2021.</p>")), undefined) as Record<string, unknown>;

    expect(result.status).toBe("ok");
    expect(result.content).toBe("Yes, since 2021.");
  });

  /** text/plain is allowed by the server, and DOMParser would eat half of it. */
  it("reads plain text as text rather than parsing it as markup", () => {
    const source = "if (a<b) { run(); }\n<script> is just a word here.";

    const result = selectFetched(
      { finalUrl: "https://example.com/llms.txt", html: source, contentType: "text/plain" },
      undefined,
    ) as Record<string, unknown>;

    expect(result.content).toBe(source);
    expect(result.outline).toEqual([]);
  });

  it.each([
    ["an error object served with a 200", { error: "Internal server error" }],
    ["a missing html field", { finalUrl: "https://example.com/" }],
    // Without it the branch above cannot tell markup from text, so it is required, not optional.
    ["a missing contentType", { finalUrl: "https://example.com/", html: "<p>Hi</p>" }],
    ["an html page instead of the envelope", "<!doctype html>"],
    ["null", null],
  ])("refuses %s rather than treating it as content", (_label, raw) => {
    expect(selectFetched(raw, undefined).status).toBe("invalid_response");
  });
});

describe("fetchViaProxy", () => {
  it("url-encodes the target and sends the wallet token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => envelope(article(LONG)) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchViaProxy("https://example.com/a?b=c&d=e", "Bearer token");

    expect(String(fetchMock.mock.calls[0][0])).toContain("/fetch?url=https%3A%2F%2Fexample.com%2Fa%3Fb%3Dc%26d%3De");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: { Authorization: "Bearer token" } });
  });

  /** A 400 says precisely why a url was refused, and the model can act on that. */
  it("surfaces the proxy's reason for refusing a url", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "example.com resolves to a non-public address" }),
      }),
    );

    await expect(fetchViaProxy("https://example.com/", "Bearer t")).rejects.toThrow(/non-public address/);
  });

  it("stays generic on any other status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await expect(fetchViaProxy("https://example.com/", "Bearer t")).rejects.toThrow("HTTP 401");
  });
});

describe("registry", () => {
  it("gates fetch_url behind the same scope as search", () => {
    const entry = TOOL_REGISTRY.find((t) => t.tool.function.name === fetchUrlTool.function.name);

    expect(entry?.ownerScope).toBe("search");
    // The citation is the url itself, carried in the result — no source line to render.
    expect(entry?.source).toBeNull();
  });
});
