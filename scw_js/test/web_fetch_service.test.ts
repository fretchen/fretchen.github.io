import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

const mockLookup = vi.fn();
vi.mock("node:dns/promises", () => ({ lookup: mockLookup }));

const { isPrivateAddress, assertPublicUrl, fetchExternalHtml, FetchUrlError } =
  await import("../web_fetch_service.js");

/**
 * This file is almost entirely SSRF tests, which is the right proportion: the rest of the module
 * is a fetch and a string. The url is chosen by a model that can be steered by any page it has
 * read, so every one of these is a path somebody could actually be talked into.
 */

/** A body the streaming reader can consume, since `readCapped` uses getReader() not text(). */
function htmlResponse(html: string, contentType = "text/html; charset=utf-8", status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    statusText: "OK",
    headers: new Headers({ "content-type": contentType }),
    body: new Blob([html]).stream(),
  };
}

function redirectTo(location: string, status = 302) {
  return {
    status,
    ok: false,
    statusText: "Found",
    headers: new Headers({ location }),
    body: null,
  };
}

beforeEach(() => {
  mockLookup.mockReset();
  // Public by default; individual tests override.
  mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isPrivateAddress", () => {
  test.each([
    ["loopback", "127.0.0.1"],
    ["private 10/8", "10.0.0.1"],
    ["private 172.16/12 low", "172.16.0.1"],
    ["private 172.16/12 high", "172.31.255.255"],
    ["private 192.168/16", "192.168.1.1"],
    ["link-local — cloud metadata", "169.254.169.254"],
    ["this network", "0.0.0.0"],
    ["carrier-grade NAT", "100.64.0.1"],
    ["multicast", "224.0.0.1"],
    ["IPv6 loopback", "::1"],
    ["IPv6 unspecified", "::"],
    ["IPv6 unique local", "fc00::1"],
    ["IPv6 unique local fd", "fd12:3456::1"],
    ["IPv6 link-local", "fe80::1"],
    ["IPv4-mapped private", "::ffff:10.0.0.1"],
    ["garbage", "not-an-ip"],
  ])("refuses %s", (_label, ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  test.each([
    ["a public v4", "93.184.216.34"],
    ["Cloudflare DNS", "1.1.1.1"],
    // The off-by-one the /12 mask invites: 172.32 is public, 172.31 is not.
    ["172.32, just outside the private block", "172.32.0.1"],
    ["172.15, just below it", "172.15.0.1"],
    ["a public v6", "2606:4700:4700::1111"],
    ["IPv4-mapped public", "::ffff:93.184.216.34"],
  ])("allows %s", (_label, ip) => {
    expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe("assertPublicUrl", () => {
  test.each([
    ["http", "http://example.com/"],
    ["file", "file:///etc/passwd"],
    ["javascript", "javascript:alert(1)"],
    ["gopher", "gopher://example.com/"],
  ])("refuses the %s scheme", async (_label, url) => {
    await expect(assertPublicUrl(url)).rejects.toThrow(FetchUrlError);
  });

  test.each([
    ["an empty string", ""],
    ["whitespace", "   "],
    ["a relative path", "/etc/passwd"],
    ["nonsense", "not a url"],
  ])("refuses %s", async (_label, url) => {
    await expect(assertPublicUrl(url)).rejects.toThrow(FetchUrlError);
  });

  test("refuses a hostname that resolves into private space", async () => {
    // The attack: the name looks public, the DNS answer is not.
    mockLookup.mockResolvedValue([{ address: "169.254.169.254", family: 4 }]);

    await expect(assertPublicUrl("https://metadata.example.com/")).rejects.toThrow(/non-public/i);
  });

  test("refuses when ANY resolved address is private, not just the first", async () => {
    mockLookup.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);

    await expect(assertPublicUrl("https://split-horizon.example.com/")).rejects.toThrow(
      /non-public/i,
    );
  });

  test("refuses a name that cannot be resolved", async () => {
    mockLookup.mockRejectedValue(new Error("ENOTFOUND"));

    await expect(assertPublicUrl("https://nope.example/")).rejects.toThrow(/resolve/i);
  });

  test("accepts a public https url", async () => {
    const url = await assertPublicUrl("  https://example.com/page?a=1  ");

    expect(url.toString()).toBe("https://example.com/page?a=1");
  });
});

describe("fetchExternalHtml", () => {
  test("returns the html, the resolved type and the final url", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(htmlResponse("<html><p>Hi</p></html>")));

    const page = await fetchExternalHtml("https://example.com/");

    expect(page).toMatchObject({
      finalUrl: "https://example.com/",
      html: "<html><p>Hi</p></html>",
      contentType: "text/html",
    });
  });

  test("identifies itself rather than fetching anonymously", async () => {
    const fetchMock = vi.fn().mockResolvedValue(htmlResponse("<html></html>"));
    vi.stubGlobal("fetch", fetchMock);

    await fetchExternalHtml("https://example.com/");

    const init = fetchMock.mock.calls[0][1] as {
      headers: Record<string, string>;
      redirect: string;
    };
    expect(init.headers["User-Agent"]).toContain("fretchen.eu");
    expect(init.redirect).toBe("manual");
  });

  test("follows a redirect and reports where it landed", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(redirectTo("https://example.com/final"))
        .mockResolvedValueOnce(htmlResponse("<html>final</html>")),
    );

    const page = await fetchExternalHtml("https://example.com/start");

    expect(page.finalUrl).toBe("https://example.com/final");
    expect(page.html).toBe("<html>final</html>");
  });

  test("resolves a relative Location against the current url", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(redirectTo("/elsewhere"))
        .mockResolvedValueOnce(htmlResponse("<html>x</html>")),
    );

    expect((await fetchExternalHtml("https://example.com/start")).finalUrl).toBe(
      "https://example.com/elsewhere",
    );
  });

  /**
   * The test the hand-written redirect loop exists for. The url handed in is public; the 302 is
   * not. Automatic redirect following would have made every other check here pointless.
   */
  test("refuses a redirect into private space", async () => {
    mockLookup.mockImplementation((host: string) =>
      host === "example.com"
        ? Promise.resolve([{ address: "93.184.216.34", family: 4 }])
        : Promise.resolve([{ address: "169.254.169.254", family: 4 }]),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(redirectTo("https://metadata.internal/latest/meta-data/")),
    );

    await expect(fetchExternalHtml("https://example.com/")).rejects.toThrow(/non-public/i);
  });

  test("refuses a redirect to a non-https scheme", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(redirectTo("http://example.com/insecure")));

    await expect(fetchExternalHtml("https://example.com/")).rejects.toThrow(/https/i);
  });

  test("gives up on a redirect loop instead of following forever", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(redirectTo("https://example.com/again")));

    await expect(fetchExternalHtml("https://example.com/")).rejects.toThrow(/too many redirects/i);
  });

  test("refuses a redirect with no Location", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ...redirectTo(""), headers: new Headers() }),
    );

    await expect(fetchExternalHtml("https://example.com/")).rejects.toThrow(/no location/i);
  });

  test.each([
    ["a pdf", "application/pdf"],
    ["an image", "image/png"],
    ["json", "application/json"],
    ["nothing at all", ""],
  ])("refuses %s without reading the body", async (_label, contentType) => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        statusText: "OK",
        headers: new Headers(contentType ? { "content-type": contentType } : {}),
        body: { cancel },
      }),
    );

    await expect(fetchExternalHtml("https://example.com/")).rejects.toThrow(FetchUrlError);
    expect(cancel).toHaveBeenCalled();
  });

  test("accepts plain text and xhtml", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(htmlResponse("plain", "text/plain")));

    expect((await fetchExternalHtml("https://example.com/")).contentType).toBe("text/plain");
  });

  test("stops reading a body past the cap instead of buffering it whole", async () => {
    const huge = "<p>" + "x".repeat(1_500_000) + "</p>";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(htmlResponse(huge)));

    const page = await fetchExternalHtml("https://example.com/");

    expect(page.html.length).toBeLessThanOrEqual(1_000_000);
    expect(page.html.length).toBeGreaterThan(0);
  });

  test("reports an upstream error status without exposing its body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ...htmlResponse("nope"), status: 403, ok: false }),
    );

    await expect(fetchExternalHtml("https://example.com/")).rejects.toThrow(/403/);
  });

  test("never calls fetch when the url fails validation", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchExternalHtml("http://example.com/")).rejects.toThrow(FetchUrlError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
