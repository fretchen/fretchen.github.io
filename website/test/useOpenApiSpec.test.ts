/**
 * useOpenApiSpec tests — the docs pages render from a live spec fetched at runtime, so the
 * hook must degrade cleanly: a network failure, an HTTP error, or a non-JSON body all have to
 * surface as `error` (never throw), so the page can show a link to the spec instead of an
 * empty table.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithQuery } from "./testUtils";
import { useOpenApiSpec } from "../hooks/useOpenApiSpec";

const SPEC_URL = "https://agent.example/openapi.json";

describe("useOpenApiSpec", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns the parsed spec on success", async () => {
    const doc = { "x-service-type": "llm/v1", components: { schemas: { A: { type: "object" } } } };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => doc })) as unknown as typeof fetch,
    );

    const { result } = renderHookWithQuery(() => useOpenApiSpec(SPEC_URL));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.spec).toEqual(doc);
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error for a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })) as unknown as typeof fetch,
    );

    const { result } = renderHookWithQuery(() => useOpenApiSpec(SPEC_URL));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.spec).toBeNull();
    expect(result.current.error).toMatch(/503/);
  });

  it("surfaces an error when the fetch throws (offline / CORS)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }) as unknown as typeof fetch,
    );

    const { result } = renderHookWithQuery(() => useOpenApiSpec(SPEC_URL));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.spec).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it("surfaces an error when the body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON");
        },
      })) as unknown as typeof fetch,
    );

    const { result } = renderHookWithQuery(() => useOpenApiSpec(SPEC_URL));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.spec).toBeNull();
    expect(result.current.error).toBeTruthy();
  });
});
