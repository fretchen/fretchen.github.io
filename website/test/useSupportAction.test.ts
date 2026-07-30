import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAccount, useWriteContract, useReadContracts, useSwitchChain, useChainId } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import { useSupportAction } from "../hooks/useSupportAction";
import { getSupportV2Config, DEFAULT_SUPPORT_CHAIN, SUPPORT_RECIPIENT_ADDRESS } from "../utils/getChain";

// The hook fetches the signer on-demand via getWalletClient(config, { chainId }) from
// wagmi/actions (avoids the reactive-useWalletClient race right after a chain switch).
vi.mock("wagmi/actions", () => ({
  getWalletClient: vi.fn(),
}));

// Mock the getChain module - simulates mainnet mode (VITE_USE_TESTNET not set)
vi.mock("../utils/getChain", async () => {
  const optimism = { id: 10, name: "OP Mainnet" };
  const base = { id: 8453, name: "Base" };

  return {
    DEFAULT_SUPPORT_CHAIN: optimism,
    SUPPORT_RECIPIENT_ADDRESS: "0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20",
    SUPPORT_V2_CHAINS: [optimism, base],
    getSupportV2Config: vi.fn((chainId: number) => {
      const addresses: Record<number, string> = {
        [optimism.id]: "0x4ca63f8A4Cd56287E854f53E18ca482D74391316",
        [base.id]: "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694",
      };
      const address = addresses[chainId];
      if (!address) return null;
      return { address, abi: [] };
    }),
    isSupportV2Chain: vi.fn((chainId: number) => {
      return chainId === optimism.id || chainId === base.id;
    }),
  };
});

// Mock only the USDC address/network lookup; keep the real EIP-3009 typed-data + signature
// helpers (buildTransferWithAuthorizationTypedData, randomAuthorizationNonce,
// splitAuthorizationSignature) so tests exercise the same logic used in production.
vi.mock("@fretchen/chain-utils", async () => {
  const actual = await vi.importActual<typeof import("@fretchen/chain-utils")>("@fretchen/chain-utils");
  return {
    ...actual,
    toCAIP2: (chainId: number) => `eip155:${chainId}`,
    getUSDCConfig: vi.fn((network: string) => {
      const configs: Record<string, unknown> = {
        "eip155:10": {
          name: "OP Mainnet",
          chainId: 10,
          address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
          decimals: 6,
          usdcName: "USD Coin",
          usdcVersion: "2",
        },
        "eip155:8453": {
          name: "Base",
          chainId: 8453,
          address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          decimals: 6,
          usdcName: "USD Coin",
          usdcVersion: "2",
        },
      };
      const config = configs[network];
      if (!config) throw new Error(`USDC not available on ${network}`);
      return config;
    }),
  };
});

// Mock analytics
vi.mock("../utils/analytics", () => ({
  trackEvent: vi.fn(),
}));

describe("useSupportAction", () => {
  // Mock functions
  const mockWriteContract = vi.fn();
  const mockSwitchChainAsync = vi.fn();
  const mockRefetch = vi.fn();
  // Deterministic 65-byte signature: r (32 bytes) + s (32 bytes) + v=27 (1 byte, 0x1b)
  const mockSignature = `0x${"11".repeat(32)}${"22".repeat(32)}1b` as `0x${string}`;
  const mockSignTypedData = vi.fn().mockResolvedValue(mockSignature);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignTypedData.mockResolvedValue(mockSignature);

    // Default mock implementations - use Optimism Mainnet (10)
    vi.mocked(useAccount).mockReturnValue({
      isConnected: true,
      chainId: 10, // Optimism Mainnet
      address: "0x1234567890abcdef1234567890abcdef12345678",
      connector: { name: "MetaMask" },
    } as unknown as ReturnType<typeof useAccount>);

    vi.mocked(useChainId).mockReturnValue(10);

    vi.mocked(useWriteContract).mockReturnValue({
      writeContract: mockWriteContract,
      isPending: false,
      data: undefined,
      error: null,
    } as unknown as ReturnType<typeof useWriteContract>);

    vi.mocked(useSwitchChain).mockReturnValue({
      switchChainAsync: mockSwitchChainAsync,
      chains: [],
    } as unknown as ReturnType<typeof useSwitchChain>);

    vi.mocked(getWalletClient).mockResolvedValue({
      signTypedData: mockSignTypedData,
    } as unknown as Awaited<ReturnType<typeof getWalletClient>>);

    // Mock useReadContracts - returns array of results for all chains
    // useReadContracts aggregates reads from multiple chains in one hook
    vi.mocked(useReadContracts).mockReturnValue({
      data: [
        { status: "success", result: BigInt(5) }, // Optimism
        { status: "success", result: BigInt(3) }, // Base
      ],
      error: null,
      isPending: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReadContracts>);

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { origin: "https://example.com" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Chain Detection", () => {
    it("should initialize hook when on Optimism Mainnet", () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 10, // Optimism Mainnet
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      // Hook should initialize without errors
      expect(result.current.isConnected).toBe(true);
      expect(result.current.errorMessage).toBeNull();
    });

    it("should initialize hook when on Base Mainnet", () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 8453, // Base Mainnet
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(result.current.isConnected).toBe(true);
      expect(result.current.errorMessage).toBeNull();
    });

    it("should initialize hook when on unsupported chain", () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 1, // Ethereum mainnet - not supported
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      // Hook should still initialize, chain check happens on handleSupport
      expect(result.current.isConnected).toBe(true);
    });

    it("should read from ALL chains for aggregated count", () => {
      renderHook(() => useSupportAction("/blog/test"));

      // useReadContracts is called once with contracts for all chains
      expect(useReadContracts).toHaveBeenCalledWith(
        expect.objectContaining({
          contracts: expect.arrayContaining([
            expect.objectContaining({ chainId: 10 }), // Optimism
            expect.objectContaining({ chainId: 8453 }), // Base
          ]),
        }),
      );
    });
  });

  describe("Contract Config", () => {
    it("should get correct contract config for Optimism Mainnet", () => {
      const config = getSupportV2Config(10);
      expect(config).not.toBeNull();
      expect(config?.address).toBe("0x4ca63f8A4Cd56287E854f53E18ca482D74391316");
    });

    it("should get correct contract config for Base Mainnet", () => {
      const config = getSupportV2Config(8453);
      expect(config).not.toBeNull();
      expect(config?.address).toBe("0xB70EA4d714Fed01ce20E93F9033008BadA1c8694");
    });

    it("should return null for unsupported chain", () => {
      const config = getSupportV2Config(1); // Ethereum mainnet
      expect(config).toBeNull();
    });
  });

  describe("handleSupport", () => {
    it("should call writeContract with correct args on supported chain", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 10, // Optimism Mainnet
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockSignTypedData).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryType: "TransferWithAuthorization",
          domain: expect.objectContaining({ chainId: 10 }),
          message: expect.objectContaining({
            to: SUPPORT_RECIPIENT_ADDRESS,
            value: 500000n,
          }),
        }),
      );

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0x4ca63f8A4Cd56287E854f53E18ca482D74391316", // Optimism Mainnet
          functionName: "donateToken",
          args: expect.arrayContaining([expect.stringContaining("/blog/test"), SUPPORT_RECIPIENT_ADDRESS]),
        }),
      );
      expect(mockWriteContract.mock.calls[0][0].args).toHaveLength(10);
    });

    it("should use Base Mainnet contract when on Base Mainnet", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 8453, // Base Mainnet
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694", // Base Mainnet
        }),
      );
    });

    it("shows a friendly message instead of the raw on-chain revert error (e.g. insufficient USDC)", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 10,
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);

      // Simulate wagmi surfacing a raw contract-revert error via useWriteContract's `error`
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        data: undefined,
        error: new Error(
          "ContractFunctionExecutionError: reverted with reason string 'ERC20: transfer amount exceeds balance' ...",
        ),
      } as unknown as ReturnType<typeof useWriteContract>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      // useLocale is globally mocked to echo the raw label key (see test/setup.ts) —
      // this must NOT be the raw Error's message.
      expect(result.current.errorMessage).toBe("metadataLine.errorDonationFailed");
      // A genuine (non-cancel) failure flags insufficient funds → drives the modal's Get-USDC state.
      expect(result.current.isInsufficientFunds).toBe(true);
    });

    it("maps a user-cancelled transaction to a 'cancelled' message, not 'no USDC'", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 10,
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);

      const rejection = new Error("User rejected the request.");
      rejection.name = "UserRejectedRequestError";
      vi.mocked(useWriteContract).mockReturnValue({
        writeContract: mockWriteContract,
        isPending: false,
        data: undefined,
        error: rejection,
      } as unknown as ReturnType<typeof useWriteContract>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(result.current.errorMessage).toBe("metadataLine.errorDonationCancelled");
      // A cancel is NOT insufficient funds — must not trigger the "Get USDC" modal state.
      expect(result.current.isInsufficientFunds).toBe(false);
    });

    it("shows the friendly wallet-not-connected message when getWalletClient throws", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 10,
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);
      // wagmi's getWalletClient can throw (e.g. ConnectorNotConnectedError) instead of resolving falsy.
      vi.mocked(getWalletClient).mockRejectedValue(new Error("ConnectorNotConnectedError"));

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(result.current.errorMessage).toBe("metadataLine.errorWalletNotConnected");
      expect(mockWriteContract).not.toHaveBeenCalled();
    });

    it("should NOT auto-switch or donate on an unsupported chain — surfaces guidance instead", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 1, // Ethereum mainnet (unsupported)
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);
      vi.mocked(useChainId).mockReturnValue(1);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(result.current.isOnSupportedChain).toBe(false);

      await act(async () => {
        await result.current.handleSupport();
      });

      // No blind wallet switch prompt and no attempted donation on the wrong chain.
      // useLocale is globally mocked to echo the raw label key (see test/setup.ts).
      expect(mockSwitchChainAsync).not.toHaveBeenCalled();
      expect(mockWriteContract).not.toHaveBeenCalled();
      expect(result.current.errorMessage).toBe("metadataLine.modalBody");
    });

    it("should NOT trigger chain switch on supported chain", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 8453, // Base Mainnet (supported)
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(result.current.isOnSupportedChain).toBe(true);

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(mockSwitchChainAsync).not.toHaveBeenCalled();
    });

    it("fetches the signer on-demand for the target chain (no spurious wallet-not-connected)", async () => {
      // Regression for the post-switch race: the reactive useWalletClient() is transiently
      // undefined right after a chain switch; getWalletClient resolves the correct client,
      // so no "wallet not connected" error should surface and the donation should proceed.
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 10,
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      // Signer fetched on-demand for the current (supported) chain
      expect(getWalletClient).toHaveBeenCalledWith(expect.anything(), { chainId: 10 });
      expect(result.current.errorMessage).toBeNull();
      expect(mockWriteContract).toHaveBeenCalled();
    });

    it("shows wallet-not-connected only when no signer can be resolved", async () => {
      vi.mocked(useAccount).mockReturnValue({
        isConnected: true,
        chainId: 10,
        address: "0x1234",
        connector: { name: "MetaMask" },
      } as unknown as ReturnType<typeof useAccount>);
      vi.mocked(getWalletClient).mockResolvedValue(null as unknown as Awaited<ReturnType<typeof getWalletClient>>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.handleSupport();
      });

      expect(result.current.errorMessage).toBe("metadataLine.errorWalletNotConnected");
      expect(mockWriteContract).not.toHaveBeenCalled();
    });
  });

  describe("switchToSupportedChain", () => {
    it("switches to the default supported chain when called explicitly", async () => {
      mockSwitchChainAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.switchToSupportedChain();
      });

      expect(mockSwitchChainAsync).toHaveBeenCalledWith({
        chainId: DEFAULT_SUPPORT_CHAIN.id,
      });
    });

    it("shows an error if the switch fails", async () => {
      mockSwitchChainAsync.mockRejectedValue(new Error("User rejected"));

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      await act(async () => {
        await result.current.switchToSupportedChain();
      });

      // useLocale is globally mocked to echo the raw label key (see test/setup.ts).
      expect(result.current.errorMessage).toBe("metadataLine.errorChainSwitchFailed");
    });
  });

  describe("Support Count (Aggregated from Mainnets)", () => {
    it("should aggregate support counts from all chains", () => {
      // Mock returns 5 from Optimism + 3 from Base = 8
      vi.mocked(useReadContracts).mockReturnValue({
        data: [
          { status: "success", result: BigInt(5) }, // Optimism
          { status: "success", result: BigInt(3) }, // Base
        ],
        error: null,
        isPending: false,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useReadContracts>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(result.current.supportCount).toBe("8");
    });

    it("should return '0' when no data from any chain", () => {
      vi.mocked(useReadContracts).mockReturnValue({
        data: undefined,
        error: null,
        isPending: false,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useReadContracts>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      expect(result.current.supportCount).toBe("0");
    });

    it("should handle partial failures gracefully", () => {
      // Only Optimism succeeds, Base fails
      vi.mocked(useReadContracts).mockReturnValue({
        data: [
          { status: "success", result: BigInt(5) },
          { status: "failure", error: new Error("RPC error") },
        ],
        error: null,
        isPending: false,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useReadContracts>);

      const { result } = renderHook(() => useSupportAction("/blog/test"));

      // Should still count successful chain
      expect(result.current.supportCount).toBe("5");
    });
  });

  describe("URL Handling", () => {
    it("should construct full URL with origin", async () => {
      const { result } = renderHook(() => useSupportAction("/blog/my-post"));

      await act(async () => {
        await result.current.handleSupport();
      });

      const writeCall = mockWriteContract.mock.calls[0][0];
      expect(writeCall.args[0]).toBe("https://example.com/blog/my-post");
      expect(writeCall.args[1]).toBe(SUPPORT_RECIPIENT_ADDRESS);
    });

    it("should strip trailing slashes from URL", async () => {
      const { result } = renderHook(() => useSupportAction("/blog/my-post/"));

      await act(async () => {
        await result.current.handleSupport();
      });

      const call = mockWriteContract.mock.calls[0][0];
      expect(call.args[0]).toBe("https://example.com/blog/my-post");
      expect(call.args[1]).toBe(SUPPORT_RECIPIENT_ADDRESS);
    });

    it("should handle empty URL path (uses origin only)", async () => {
      // When url is empty string, fullUrl becomes just window.location.origin
      // The hook accepts this as valid - this tests that behavior
      const { result } = renderHook(() => useSupportAction(""));

      await act(async () => {
        await result.current.handleSupport();
      });

      // Empty path still results in origin URL being used
      const call = mockWriteContract.mock.calls[0][0];
      expect(call.args[0]).toBe("https://example.com");
      expect(call.args[1]).toBe(SUPPORT_RECIPIENT_ADDRESS);
    });
  });
});
