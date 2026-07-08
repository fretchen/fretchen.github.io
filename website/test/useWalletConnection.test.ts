import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAccount, useConnect } from "wagmi";
import { useWalletConnection } from "../hooks/useWalletConnection";

const injectedConnector = { uid: "mm", name: "MetaMask", type: "injected" };
const wcConnector = { uid: "wc", name: "WalletConnect", type: "walletConnect" };

function mockConnect(connectors: unknown[], connect = vi.fn()) {
  vi.mocked(useConnect).mockReturnValue({ connectors, connect } as unknown as ReturnType<typeof useConnect>);
  return connect;
}

function mockAccount(status: string, address?: string) {
  vi.mocked(useAccount).mockReturnValue({ status, address } as unknown as ReturnType<typeof useAccount>);
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
    const { result } = renderHook(() => useWalletConnection());
    result.current.connectWallet();
    expect(connect).toHaveBeenCalledWith({ connector: injectedConnector });
  });

  it("connectWallet is a no-op when there are no connectors", () => {
    const connect = mockConnect([]);
    const { result } = renderHook(() => useWalletConnection());
    result.current.connectWallet();
    expect(connect).not.toHaveBeenCalled();
  });

  it("canConnect reflects whether any connector is available", () => {
    mockConnect([wcConnector]);
    const { result } = renderHook(() => useWalletConnection());
    expect(result.current.canConnect).toBe(true);
  });

  it("canConnect is false with an empty connector list", () => {
    mockConnect([]);
    const { result } = renderHook(() => useWalletConnection());
    expect(result.current.canConnect).toBe(false);
  });
});
