import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getS3Object,
  putS3Object,
  getS3BaseUrl,
  getS3ObjectWithMeta,
  putS3ObjectConditional,
  deleteS3Object,
  listObjects,
} from "../src/index.js";

describe("getS3Object / putS3Object", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env.SCW_ACCESS_KEY = "test-access-key";
    process.env.SCW_SECRET_KEY = "test-secret-key";
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SCW_ACCESS_KEY;
    delete process.env.SCW_SECRET_KEY;
  });

  test("getS3Object returns null on 404", async () => {
    mockFetch.mockResolvedValueOnce(new Response("NoSuchKey", { status: 404 }));
    const result = await getS3Object("some/key.json");
    expect(result).toBeNull();
  });

  test("getS3Object returns body text on success", async () => {
    mockFetch.mockResolvedValueOnce(new Response('{"a":1}', { status: 200 }));
    const result = await getS3Object("some/key.json");
    expect(result).toBe('{"a":1}');
  });

  test("getS3Object throws with status on non-ok, non-404 response", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("forbidden", { status: 403, statusText: "Forbidden" })
    );
    await expect(getS3Object("some/key.json")).rejects.toThrow(/403/);
  });

  test("getS3Object signs a GET request to the correct virtual-hosted-style URL", async () => {
    mockFetch.mockResolvedValueOnce(new Response("body", { status: 200 }));
    await getS3Object("growth-agent/content_queue.json");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/growth-agent/content_queue.json");
    expect(init.method).toBe("GET");
    expect(init.headers.authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=test-access-key\//);
    expect(init.headers["x-amz-content-sha256"]).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" // sha256("")
    );
  });

  test("getS3Object throws when credentials are missing", async () => {
    delete process.env.SCW_ACCESS_KEY;
    await expect(getS3Object("some/key.json")).rejects.toThrow(/Missing S3 credentials/);
  });

  test("putS3Object throws on non-ok response", async () => {
    // Sticky (not "once"): a 5xx retries internally, so every attempt sees the
    // same response until retries are exhausted and the final one is returned.
    mockFetch.mockResolvedValue(
      new Response("error", { status: 500, statusText: "Internal Error" })
    );
    await expect(
      putS3Object("some/key.json", "{}", { contentType: "application/json" })
    ).rejects.toThrow(/500/);
  });

  test("putS3Object throws when credentials are missing", async () => {
    delete process.env.SCW_SECRET_KEY;
    await expect(
      putS3Object("some/key.json", "{}", { contentType: "application/json" })
    ).rejects.toThrow(/Missing S3 credentials/);
  });

  test("putS3Object maps contentType to Content-Type and omits ACL/Cache-Control when not provided", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 200 }));
    await putS3Object("growth-agent/state.json", "{}", { contentType: "application/json" });
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe("PUT");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(init.headers["x-amz-acl"]).toBeUndefined();
    expect(init.headers["cache-control"]).toBeUndefined();
    expect(init.body).toBe("{}");
  });

  test("putS3Object maps acl to x-amz-acl when provided", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 200 }));
    await putS3Object("images/pic.jpg", "binary", {
      contentType: "image/jpeg",
      acl: "public-read",
    });
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers["x-amz-acl"]).toBe("public-read");
  });

  test("putS3Object maps cacheControl to Cache-Control when provided", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 200 }));
    await putS3Object("images/pic.jpg", "binary", {
      contentType: "image/jpeg",
      acl: "public-read",
      cacheControl: "public, max-age=31536000, immutable",
    });
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
  });

  test("getS3Object and putS3Object include x-amz-acl/cache-control in SignedHeaders when present", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 200 }));
    await putS3Object("images/pic.jpg", "binary", {
      contentType: "image/jpeg",
      acl: "public-read",
      cacheControl: "public, max-age=31536000, immutable",
    });
    const [, init] = mockFetch.mock.calls[0];
    const signedHeadersMatch = /SignedHeaders=([^,]+)/.exec(init.headers.authorization as string);
    expect(signedHeadersMatch?.[1]).toBe(
      "cache-control;content-type;host;x-amz-acl;x-amz-content-sha256;x-amz-date"
    );
  });

  describe("retry behavior", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test("retries on a 5xx response and succeeds once a later attempt returns 2xx", async () => {
      mockFetch
        .mockResolvedValueOnce(new Response("error", { status: 503, statusText: "Unavailable" }))
        .mockResolvedValueOnce(new Response("error", { status: 503, statusText: "Unavailable" }))
        .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));

      const promise = getS3Object("some/key.json");
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('{"ok":true}');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test("retries on a thrown network error and succeeds once a later attempt resolves", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("ECONNRESET"))
        .mockResolvedValueOnce(new Response("body", { status: 200 }));

      const promise = getS3Object("some/key.json");
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe("body");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test("exhausts retries and throws after 3 attempts", async () => {
      mockFetch.mockRejectedValue(new Error("ECONNRESET"));

      const promise = getS3Object("some/key.json");
      // Attach a rejection handler immediately so the eventual rejection isn't
      // reported as unhandled while timers are advanced below.
      const assertion = expect(promise).rejects.toThrow(/ECONNRESET/);
      await vi.runAllTimersAsync();
      await assertion;

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test("does not retry a 4xx response", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("forbidden", { status: 403, statusText: "Forbidden" })
      );

      await expect(getS3Object("some/key.json")).rejects.toThrow(/403/);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

describe("getS3ObjectWithMeta", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env.SCW_ACCESS_KEY = "test-access-key";
    process.env.SCW_SECRET_KEY = "test-secret-key";
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SCW_ACCESS_KEY;
    delete process.env.SCW_SECRET_KEY;
  });

  test("returns null on 404", async () => {
    mockFetch.mockResolvedValueOnce(new Response("NoSuchKey", { status: 404 }));
    const result = await getS3ObjectWithMeta("channels/abc.json");
    expect(result).toBeNull();
  });

  test("returns body and etag on success", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('{"a":1}', { status: 200, headers: { etag: '"abc123"' } })
    );
    const result = await getS3ObjectWithMeta("channels/abc.json");
    expect(result).toEqual({ body: '{"a":1}', etag: '"abc123"' });
  });

  test("throws on non-ok, non-404 response", async () => {
    mockFetch.mockResolvedValueOnce(new Response("forbidden", { status: 403, statusText: "Forbidden" }));
    await expect(getS3ObjectWithMeta("channels/abc.json")).rejects.toThrow(/403/);
  });
});

describe("putS3ObjectConditional", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env.SCW_ACCESS_KEY = "test-access-key";
    process.env.SCW_SECRET_KEY = "test-secret-key";
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SCW_ACCESS_KEY;
    delete process.env.SCW_SECRET_KEY;
  });

  test("returns ok:false, status:412 on precondition failure instead of throwing", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 412, statusText: "Precondition Failed" }));
    const result = await putS3ObjectConditional("channels/abc.json", "{}", {
      contentType: "application/json",
      ifMatch: '"stale-etag"',
    });
    expect(result).toEqual({ ok: false, status: 412 });
  });

  test("returns ok:true with etag on success", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 200, headers: { etag: '"new-etag"' } }));
    const result = await putS3ObjectConditional("channels/abc.json", "{}", {
      contentType: "application/json",
      ifNoneMatch: "*",
    });
    expect(result).toEqual({ ok: true, etag: '"new-etag"' });
  });

  test("sends if-match and if-none-match headers when provided", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 200 }));
    await putS3ObjectConditional("channels/abc.json", "{}", {
      contentType: "application/json",
      ifMatch: '"etag-1"',
    });
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers["if-match"]).toBe('"etag-1"');
    expect(init.headers["if-none-match"]).toBeUndefined();
  });

  test("throws on non-ok, non-412 response", async () => {
    mockFetch.mockResolvedValue(new Response("error", { status: 500, statusText: "Internal Error" }));
    await expect(
      putS3ObjectConditional("channels/abc.json", "{}", {
        contentType: "application/json",
        ifNoneMatch: "*",
      })
    ).rejects.toThrow(/500/);
  });
});

describe("deleteS3Object", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env.SCW_ACCESS_KEY = "test-access-key";
    process.env.SCW_SECRET_KEY = "test-secret-key";
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SCW_ACCESS_KEY;
    delete process.env.SCW_SECRET_KEY;
  });

  test("returns ok:true on success", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const result = await deleteS3Object("channels/abc.json");
    expect(result).toEqual({ ok: true });
  });

  test("treats a 404 as success", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 404 }));
    const result = await deleteS3Object("channels/abc.json");
    expect(result).toEqual({ ok: true });
  });

  test("returns ok:false, status:412 on precondition failure", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 412 }));
    const result = await deleteS3Object("channels/abc.json", { ifMatch: '"stale"' });
    expect(result).toEqual({ ok: false, status: 412 });
  });

  test("sends the DELETE method and if-match header", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await deleteS3Object("channels/abc.json", { ifMatch: '"etag-1"' });
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe("DELETE");
    expect(init.headers["if-match"]).toBe('"etag-1"');
  });

  test("throws on non-ok, non-404, non-412 response", async () => {
    mockFetch.mockResolvedValue(new Response("error", { status: 500, statusText: "Internal Error" }));
    await expect(deleteS3Object("channels/abc.json")).rejects.toThrow(/500/);
  });
});

describe("listObjects", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env.SCW_ACCESS_KEY = "test-access-key";
    process.env.SCW_SECRET_KEY = "test-secret-key";
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SCW_ACCESS_KEY;
    delete process.env.SCW_SECRET_KEY;
  });

  test("parses Key entries out of the ListObjectsV2 XML response", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <Contents><Key>channels/0xabc.json</Key></Contents>
  <Contents><Key>channels/0xdef.json</Key></Contents>
</ListBucketResult>`;
    mockFetch.mockResolvedValueOnce(new Response(xml, { status: 200 }));
    const result = await listObjects("channels/");
    expect(result).toEqual(["channels/0xabc.json", "channels/0xdef.json"]);
  });

  test("returns an empty array when there are no matching keys", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult></ListBucketResult>`;
    mockFetch.mockResolvedValueOnce(new Response(xml, { status: 200 }));
    const result = await listObjects("channels/");
    expect(result).toEqual([]);
  });

  test("sends list-type and prefix as a signed query string against the bucket root", async () => {
    const xml = `<ListBucketResult></ListBucketResult>`;
    mockFetch.mockResolvedValueOnce(new Response(xml, { status: 200 }));
    await listObjects("channels/");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://my-imagestore.s3.nl-ams.scw.cloud/?list-type=2&prefix=channels%2F"
    );
    expect(init.method).toBe("GET");
  });

  test("throws on non-ok response", async () => {
    mockFetch.mockResolvedValue(new Response("error", { status: 500, statusText: "Internal Error" }));
    await expect(listObjects("channels/")).rejects.toThrow(/500/);
  });

  test("decodes XML entities in key names", async () => {
    const xml = `<ListBucketResult><Contents><Key>channels/a&amp;b.json</Key></Contents></ListBucketResult>`;
    mockFetch.mockResolvedValueOnce(new Response(xml, { status: 200 }));
    const result = await listObjects("channels/");
    expect(result).toEqual(["channels/a&b.json"]);
  });
});

describe("getS3BaseUrl", () => {
  afterEach(() => {
    delete process.env.SCW_S3_BUCKET;
    delete process.env.SCW_S3_REGION;
  });

  test("returns the default bucket/region URL when no env vars are set", () => {
    expect(getS3BaseUrl()).toBe("https://my-imagestore.s3.nl-ams.scw.cloud/");
  });

  test("reflects SCW_S3_BUCKET and SCW_S3_REGION overrides", () => {
    process.env.SCW_S3_BUCKET = "other-bucket";
    process.env.SCW_S3_REGION = "fr-par";
    expect(getS3BaseUrl()).toBe("https://other-bucket.s3.fr-par.scw.cloud/");
  });
});
