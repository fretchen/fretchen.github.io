import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAccount, useConnect } from "wagmi";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { WalletEvents } from "../utils/analytics";
import { buildAccountData, buildConnectData, type AccountDataOverrides } from "./setup";
import * as analytics from "../utils/analytics";

const injectedConnector = { uid: "mm", name: "MetaMask", type: "injected" };
const wcConnector = { uid: "wc", name: "WalletConnect", type: "walletConnect" };

function mockConnect(connectors: unknown[], connect = vi.fn()) {
  vi.mocked(useConnect).mockReturnValue(buildConnectData({ connectors, connect }));
  return connect;
}

function mockAccount(status: string, address?: string) {
  vi.mocked(useAccount).mockReturnValue(
    buildAccountData({
      status: status as AccountDataOverrides["status"],
      address: address as AccountDataOverrides["address"],
    }),
  );
}

describe("useWalletConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect([]);
    mockAccount("disconnected");
  });

  it("isConnected is true only once status === 'connected' (after mount)", async () => {
    mockAccount("connected", "0xabc");
    const { result } = renderHook(() => useWalletConnection());
    await waitFor(() => expect(result.current.hasMounted).toBe(true));
    expect(result.current.isConnected).toBe(true);
  });

  it("isConnected is false while reconnecting (address not yet trustworthy)", async () => {
    mockAccount("reconnecting", "0xabc");
    const { result } = renderHook(() => useWalletConnection());
    await waitFor(() => expect(result.current.hasMounted).toBe(true));
    expect(result.current.isConnected).toBe(false);
  });

  it("connectWallet picks the injected connector and calls connect with it", async () => {
    const connect = mockConnect([wcConnector, injectedConnector]);
    const trackEvent = vi.spyOn(analytics, "trackEvent");
    const { result } = renderHook(() => useWalletConnection());
    result.current.connectWallet("test-source");
    expect(connect).toHaveBeenCalledWith({ connector: injectedConnector });
    expect(trackEvent).toHaveBeenCalledWith(WalletEvents.CONNECT_ATTEMPT, { source: "test-source" });
  });

  it("connectWallet is a no-op when there are no connectors", () => {
    const connect = mockConnect([]);
    const { result } = renderHook(() => useWalletConnection());
    result.current.connectWallet("test-source");
    expect(connect).not.toHaveBeenCalled();
  });

  it("connectWallet does not fall back to WalletConnect before discovery has settled", () => {
    // The first render's connector list is [walletConnect] alone (ssr: true defers
    // EIP-6963 discovery to a mount effect) — the fallback must not fire in that window.
    const connect = mockConnect([wcConnector]);
    const { result } = renderHook(() => useWalletConnection());
    result.current.connectWallet("test-source");
    expect(connect).not.toHaveBeenCalled();
  });

  it("connectWallet falls back to WalletConnect once discovery has settled", async () => {
    const connect = mockConnect([wcConnector]);
    const { result } = renderHook(() => useWalletConnection());
    // Let the 0ms settle timer fire and the hook re-render with the new callback.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    result.current.connectWallet("test-source");
    expect(connect).toHaveBeenCalledWith({ connector: wcConnector });
  });

  it("connectWallet picks an injected connector that appears after the first render", () => {
    // EIP-6963 discovery appends the installed wallet one commit after mount.
    const connect = mockConnect([wcConnector]);
    const { result, rerender } = renderHook(() => useWalletConnection());
    mockConnect([wcConnector, injectedConnector], connect);
    rerender();
    result.current.connectWallet("test-source");
    expect(connect).toHaveBeenCalledWith({ connector: injectedConnector });
    expect(connect).not.toHaveBeenCalledWith({ connector: wcConnector });
  });
});
