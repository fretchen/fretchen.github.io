import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// =============================================================================
// EXPORTABLE MOCK FUNCTIONS
// Tests can import these and configure them per test/describe block
// =============================================================================

// Chain & Network Mocks
export const mockChainId = vi.fn(() => 10); // Default: Optimism
export const mockSwitchChainAsync = vi.fn().mockResolvedValue(undefined);

// Account Mocks
export const mockAccountData = vi.fn(() => ({
  address: "0x123456789abcdef" as `0x${string}`,
  isConnected: false,
  status: "disconnected" as const,
  isConnecting: false,
  isDisconnected: true,
  isReconnecting: false,
}));

// Contract Mocks
export const mockReadContractData = vi.fn(() => ({
  data: undefined,
  error: null,
  isPending: false,
  refetch: vi.fn(),
}));

export const mockWriteContractData = vi.fn(() => ({
  writeContract: vi.fn(),
  writeContractAsync: vi.fn(),
  isPending: false,
  error: null,
}));

// =============================================================================
// WAGMI MOCK SETUP - Uses the exportable functions above
// =============================================================================

vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => mockAccountData()),
  useWalletClient: vi.fn(() => ({ data: undefined })),
  useSignMessage: vi.fn(() => ({ signMessageAsync: vi.fn() })),
  useReadContract: vi.fn(() => mockReadContractData()),
  useReadContracts: vi.fn(() => mockReadContractData()),
  useWriteContract: vi.fn(() => mockWriteContractData()),
  useWaitForTransactionReceipt: vi.fn(() => ({ isLoading: false, isSuccess: false })),
  useChainId: vi.fn(() => mockChainId()),
  useSwitchChain: vi.fn(() => ({
    switchChain: vi.fn(),
    switchChainAsync: mockSwitchChainAsync,
    chains: [],
  })),
  useConnect: vi.fn(() => ({ connectors: [], connect: vi.fn() })),
  useDisconnect: vi.fn(() => ({ disconnect: vi.fn() })),
  useEnsName: vi.fn(() => ({ data: null })),
  createConfig: vi.fn(() => ({})),
  http: vi.fn(),
  WagmiProvider: vi.fn(({ children }) => children),
}));

// Mock wagmi/connectors
vi.mock("wagmi/connectors", () => ({
  injected: vi.fn(() => ({})),
  walletConnect: vi.fn(() => ({})),
  metaMask: vi.fn(() => ({})),
}));

// Mock @wagmi/core
vi.mock("@wagmi/core", () => ({
  getPublicClient: vi.fn(() => ({
    readContract: vi.fn().mockResolvedValue("https://ipfs.io/ipfs/QmTest123/metadata.json"),
    chain: { id: 10, name: "Optimism" },
  })),
}));

// Mock vike-react hooks
vi.mock("vike-react/usePageContext", () => ({
  usePageContext: vi.fn(() => ({
    urlPathname: "/test",
    routeParams: { id: "0" },
  })),
}));

// Mock useLocale hook
vi.mock("./hooks/useLocale", () => ({
  useLocale: vi.fn(({ label }: { label: string }) => label),
}));

// NOTE: useAutoNetwork is NOT mocked here anymore!
// Tests that need specific useAutoNetwork behavior should:
// 1. Configure mockChainId() for the desired chain
// 2. Let the real hook run with mocked wagmi hooks

// =============================================================================
// HELPER FUNCTIONS FOR TESTS
// =============================================================================

// Reusable mock data
export const MOCK_CONNECTED_ACCOUNT = {
  address: "0x1234567890123456789012345678901234567890" as `0x${string}`,
  isConnected: true,
  status: "connected" as const,
  isConnecting: false,
  isDisconnected: false,
  isReconnecting: false,
};

export const MOCK_DISCONNECTED_ACCOUNT = {
  address: undefined,
  isConnected: false,
  status: "disconnected" as const,
  isConnecting: false,
  isDisconnected: true,
  isReconnecting: false,
};

// Helper to set chain for a test
export const mockChain = (chainId: number) => {
  mockChainId.mockReturnValue(chainId);
};

// Helper to set connected wallet
export const mockConnectedWallet = () => {
  mockAccountData.mockReturnValue(MOCK_CONNECTED_ACCOUNT);
};

export const mockDisconnectedWallet = () => {
  mockAccountData.mockReturnValue(MOCK_DISCONNECTED_ACCOUNT);
};

// Clean up after each test
afterEach(() => {
  cleanup();
  // Reset all mock return values to defaults
  mockChainId.mockReturnValue(10);
  mockAccountData.mockReturnValue({
    address: "0x123456789abcdef" as `0x${string}`,
    isConnected: false,
    status: "disconnected" as const,
    isConnecting: false,
    isDisconnected: true,
    isReconnecting: false,
  });
  mockSwitchChainAsync.mockResolvedValue(undefined);
});
