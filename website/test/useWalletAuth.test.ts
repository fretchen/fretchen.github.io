import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAccount, useSignMessage } from "wagmi";
import { useWalletAuth, clearAuthCacheForTesting } from "../hooks/useWalletAuth";

// wagmi is globally mocked in test/setup.ts

const TEST_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`;
const MOCK_SIGNATURE = "0xmocksignature";

describe("useWalletAuth", () => {
  const mockSign = vi.fn();

  beforeEach(() => {
    clearAuthCacheForTesting();
    vi.clearAllMocks();

    vi.mocked(useAccount).mockReturnValue({
      address: TEST_ADDRESS,
      isConnected: true,
    } as ReturnType<typeof useAccount>);

    vi.mocked(useSignMessage).mockReturnValue({
      signMessageAsync: mockSign,
    } as unknown as ReturnType<typeof useSignMessage>);

    mockSign.mockResolvedValue(MOCK_SIGNATURE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a Bearer token containing the address and message prefix", async () => {
    const { result } = renderHook(() => useWalletAuth("test-prefix"));
    const token = await result.current();
    expect(token).toMatch(/^Bearer /);
    const payload = JSON.parse(atob(token.slice(7))) as { address: string; message: string; signature: string };
    expect(payload.address).toBe(TEST_ADDRESS);
    expect(payload.message).toMatch(/^test-prefix:\d+$/);
    expect(payload.signature).toBe(MOCK_SIGNATURE);
  });

  it("returns cached token on second call within TTL (signs only once)", async () => {
    const { result } = renderHook(() => useWalletAuth("test-prefix"));
    const token1 = await result.current();
    const token2 = await result.current();
    expect(token1).toBe(token2);
    expect(mockSign).toHaveBeenCalledTimes(1);
  });

  it("re-signs after cache TTL expires", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWalletAuth("test-prefix"));

    await act(async () => {
      await result.current();
    });
    expect(mockSign).toHaveBeenCalledTimes(1);

    // Advance past 4-minute TTL
    vi.advanceTimersByTime(4 * 60 * 1000 + 1000);

    await act(async () => {
      await result.current();
    });
    expect(mockSign).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent in-flight signing requests", async () => {
    let resolveSign!: (value: string) => void;
    const delayedPromise = new Promise<string>((resolve) => {
      resolveSign = resolve;
    });
    mockSign.mockReturnValue(delayedPromise);

    const { result } = renderHook(() => useWalletAuth("test-prefix"));

    // Start two concurrent calls before sign resolves
    const promise1 = result.current();
    const promise2 = result.current();

    resolveSign(MOCK_SIGNATURE);
    const [token1, token2] = await Promise.all([promise1, promise2]);

    expect(token1).toBe(token2);
    expect(mockSign).toHaveBeenCalledTimes(1);
  });

  it("isolates cache by prefix — different prefixes sign separately", async () => {
    const { result: resultA } = renderHook(() => useWalletAuth("growth-api"));
    const { result: resultB } = renderHook(() => useWalletAuth("leaf-history"));

    const tokenA = await resultA.current();
    const tokenB = await resultB.current();

    // Both tokens are issued (two sign calls)
    expect(mockSign).toHaveBeenCalledTimes(2);

    // Tokens embed different message prefixes
    const payloadA = JSON.parse(atob(tokenA.slice(7))) as { message: string };
    const payloadB = JSON.parse(atob(tokenB.slice(7))) as { message: string };
    expect(payloadA.message).toMatch(/^growth-api:/);
    expect(payloadB.message).toMatch(/^leaf-history:/);
  });

  it("cleans up pendingAuthMap on sign failure so the next call retries", async () => {
    mockSign.mockRejectedValueOnce(new Error("User rejected")).mockResolvedValue(MOCK_SIGNATURE);

    const { result } = renderHook(() => useWalletAuth("test-prefix"));

    await expect(result.current()).rejects.toThrow("User rejected");

    // Second call should succeed — pendingAuthMap was cleaned up
    const token = await result.current();
    expect(token).toMatch(/^Bearer /);
    expect(mockSign).toHaveBeenCalledTimes(2);
  });

  it("throws when wallet is not connected (address is undefined)", async () => {
    vi.mocked(useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as ReturnType<typeof useAccount>);

    const { result } = renderHook(() => useWalletAuth("test-prefix"));
    await expect(result.current()).rejects.toThrow("Wallet not connected");
    expect(mockSign).not.toHaveBeenCalled();
  });

  it("clearAuthCacheForTesting forces re-sign on next call", async () => {
    const { result } = renderHook(() => useWalletAuth("test-prefix"));

    await result.current();
    expect(mockSign).toHaveBeenCalledTimes(1);

    clearAuthCacheForTesting();

    await result.current();
    expect(mockSign).toHaveBeenCalledTimes(2);
  });
});
