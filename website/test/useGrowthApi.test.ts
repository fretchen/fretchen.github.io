import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAccount, useSignMessage } from "wagmi";
import { useGrowthApi } from "../hooks/useGrowthApi";

const OWNER_ADDRESS = "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C";

describe("useGrowthApi", () => {
  const mockSignMessageAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();

    vi.mocked(useAccount).mockReturnValue({
      address: OWNER_ADDRESS,
      isConnected: true,
    } as ReturnType<typeof useAccount>);

    vi.mocked(useSignMessage).mockReturnValue({
      signMessageAsync: mockSignMessageAsync,
    } as unknown as ReturnType<typeof useSignMessage>);

    mockSignMessageAsync.mockResolvedValue("0xmocksignature");
  });

  function mockFetchResponse(data: unknown, status = 200) {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
    } as Response);
  }

  it("fetchDrafts calls GET /drafts with auth header", async () => {
    const queue = { drafts: [], approved: [], published: [], rejected: [] };
    mockFetchResponse(queue);

    const { result } = renderHook(() => useGrowthApi());
    const data = await result.current.fetchDrafts();

    expect(data).toEqual(queue);
    expect(globalThis.fetch).toHaveBeenCalledOnce();

    const [url, opts] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toMatch(/\/drafts$/);
    expect(opts?.headers).toBeDefined();
    const headers = opts!.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Bearer /);

    // Verify auth payload structure
    const payload = JSON.parse(atob(headers.Authorization.replace("Bearer ", "")));
    expect(payload.address).toBe(OWNER_ADDRESS);
    expect(payload.signature).toBe("0xmocksignature");
    expect(payload.message).toMatch(/^growth-api:\d+$/);
  });

  it("fetchDrafts passes status query param", async () => {
    mockFetchResponse({ drafts: [], approved: [], published: [], rejected: [] });

    const { result } = renderHook(() => useGrowthApi());
    await result.current.fetchDrafts("pending_approval");

    const [url] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toContain("?status=pending_approval");
  });

  it("fetchInsights calls GET /insights", async () => {
    const insights = { growth_opportunities: [], last_analysis: null };
    mockFetchResponse(insights);

    const { result } = renderHook(() => useGrowthApi());
    const data = await result.current.fetchInsights();

    expect(data).toEqual(insights);
    const [url] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toMatch(/\/insights$/);
  });

  it("fetchPerformance calls GET /performance", async () => {
    const perf = { posts: [] };
    mockFetchResponse(perf);

    const { result } = renderHook(() => useGrowthApi());
    const data = await result.current.fetchPerformance();

    expect(data).toEqual(perf);
    const [url] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toMatch(/\/performance$/);
  });

  it("updateDraft calls PUT /drafts/:id with body", async () => {
    const draft = { id: "d1", content: "updated" };
    mockFetchResponse(draft);

    const { result } = renderHook(() => useGrowthApi());
    const data = await result.current.updateDraft("d1", { content: "updated" });

    expect(data).toEqual(draft);
    const [url, opts] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toMatch(/\/drafts\/d1$/);
    expect(opts?.method).toBe("PUT");
    expect(JSON.parse(opts!.body as string)).toEqual({ content: "updated" });
  });

  it("approveDraft calls POST /drafts/:id/approve", async () => {
    const draft = { id: "d1", status: "approved" };
    mockFetchResponse(draft);

    const { result } = renderHook(() => useGrowthApi());
    await result.current.approveDraft("d1", "2026-04-15T09:00:00Z");

    const [url, opts] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toMatch(/\/drafts\/d1\/approve$/);
    expect(opts?.method).toBe("POST");
    expect(JSON.parse(opts!.body as string)).toEqual({ scheduled_at: "2026-04-15T09:00:00Z" });
  });

  it("approveDraft without scheduledAt sends no body", async () => {
    mockFetchResponse({ id: "d1", status: "approved" });

    const { result } = renderHook(() => useGrowthApi());
    await result.current.approveDraft("d1");

    const [, opts] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(opts?.body).toBeUndefined();
  });

  it("rejectDraft calls POST /drafts/:id/reject", async () => {
    mockFetchResponse({ id: "d1", status: "rejected" });

    const { result } = renderHook(() => useGrowthApi());
    await result.current.rejectDraft("d1");

    const [url, opts] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toMatch(/\/drafts\/d1\/reject$/);
    expect(opts?.method).toBe("POST");
  });

  it("throws on non-2xx response with error message", async () => {
    mockFetchResponse({ error: "Not the owner" }, 401);

    const { result } = renderHook(() => useGrowthApi());
    await expect(result.current.fetchDrafts()).rejects.toThrow("Not the owner");
  });

  it("throws when wallet not connected", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as ReturnType<typeof useAccount>);

    const { result } = renderHook(() => useGrowthApi());
    await expect(result.current.fetchDrafts()).rejects.toThrow("Wallet not connected");
  });

  describe("auth caching", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("reuses cached auth for rapid consecutive calls", async () => {
      mockFetchResponse({ drafts: [], approved: [], published: [], rejected: [] });
      mockFetchResponse({ growth_opportunities: [], last_analysis: null });

      const { result } = renderHook(() => useGrowthApi());
      await result.current.fetchDrafts();
      await result.current.fetchInsights();

      expect(mockSignMessageAsync).toHaveBeenCalledTimes(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("requests new signature after cache expires (4 min)", async () => {
      mockFetchResponse({ drafts: [], approved: [], published: [], rejected: [] });
      mockFetchResponse({ drafts: [], approved: [], published: [], rejected: [] });

      const { result } = renderHook(() => useGrowthApi());
      await result.current.fetchDrafts();
      expect(mockSignMessageAsync).toHaveBeenCalledTimes(1);

      // Advance past the 4-minute TTL
      vi.advanceTimersByTime(4 * 60 * 1000 + 1);

      await result.current.fetchDrafts();
      expect(mockSignMessageAsync).toHaveBeenCalledTimes(2);
    });

    it("deduplicates parallel in-flight signing requests", async () => {
      mockFetchResponse({ drafts: [], approved: [], published: [], rejected: [] });
      mockFetchResponse({ growth_opportunities: [], last_analysis: null });

      const { result } = renderHook(() => useGrowthApi());

      // Fire both calls simultaneously (like Promise.all on page load)
      const [drafts, insights] = await Promise.all([result.current.fetchDrafts(), result.current.fetchInsights()]);

      expect(drafts).toBeDefined();
      expect(insights).toBeDefined();
      // Only one wallet signature popup despite two parallel calls
      expect(mockSignMessageAsync).toHaveBeenCalledTimes(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("invalidates cache when address changes", async () => {
      mockFetchResponse({ drafts: [], approved: [], published: [], rejected: [] });
      mockFetchResponse({ drafts: [], approved: [], published: [], rejected: [] });

      const { result, rerender } = renderHook(() => useGrowthApi());
      await result.current.fetchDrafts();
      expect(mockSignMessageAsync).toHaveBeenCalledTimes(1);

      // Switch wallet address
      vi.mocked(useAccount).mockReturnValue({
        address: "0x1111111111111111111111111111111111111111",
        isConnected: true,
      } as ReturnType<typeof useAccount>);
      rerender();

      await result.current.fetchDrafts();
      expect(mockSignMessageAsync).toHaveBeenCalledTimes(2);
    });
  });
});
