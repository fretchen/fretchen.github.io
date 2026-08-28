import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type { useAccount, useConnect, useWalletClient } from "wagmi";

// =============================================================================
// GLOBAL BROWSER API MOCKS
// =============================================================================

// Mock IntersectionObserver for components using scroll-spy
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);

  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    // Constructor is called but we don't need to track instances for these tests
  }
}

// Set globally before any tests run
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

// =============================================================================
// EXPORTABLE MOCK FUNCTIONS
// Tests can import these and configure them per test/describe block
// =============================================================================

// Chain & Network Mocks
export const mockChainId = vi.fn(() => 10); // Default: Optimism
export const mockSwitchChainAsync = vi.fn().mockResolvedValue(undefined);

// =============================================================================
// SHARED HOOK-RETURN BUILDERS
// One typed shape per wagmi hook, built once here rather than re-declared as a
// hand-rolled literal (+ its own `as unknown as ReturnType<typeof useX>` cast) in
// every test file that mocks it. Callers pass only the fields that differ from the
// default; the builder owns the cast.
// =============================================================================

export interface AccountDataOverrides {
  address?: `0x${string}` | undefined;
  isConnected?: boolean;
  status?: "connected" | "reconnecting" | "connecting" | "disconnected";
  isConnecting?: boolean;
  isDisconnected?: boolean;
  isReconnecting?: boolean;
  chainId?: number;
  connector?: { name: string } | undefined;
  addresses?: readonly `0x${string}`[];
  chain?: unknown;
}

export function buildAccountData(overrides: AccountDataOverrides = {}): ReturnType<typeof useAccount> {
  return {
    address: "0x123456789abcdef" as `0x${string}`,
    isConnected: false,
    // Derived from isConnected when the caller doesn't pass status explicitly, so
    // `buildAccountData({ isConnected: true })` produces an internally-consistent
    // mock — hooks/useIsWalletConnected.ts (and anything built on it) reads status,
    // not isConnected.
    status: overrides.isConnected ? "connected" : "disconnected",
    isConnecting: false,
    isDisconnected: true,
    isReconnecting: false,
    ...overrides,
  } as unknown as ReturnType<typeof useAccount>;
}

export interface WalletClientDataOverrides {
  data?: Record<string, unknown> | undefined;
}

export function buildWalletClientData(overrides: WalletClientDataOverrides = {}): ReturnType<typeof useWalletClient> {
  return { data: undefined, ...overrides } as unknown as ReturnType<typeof useWalletClient>;
}

export interface ConnectDataOverrides {
  connectors?: unknown[];
  connect?: ReturnType<typeof vi.fn>;
}

export function buildConnectData(overrides: ConnectDataOverrides = {}): ReturnType<typeof useConnect> {
  return { connectors: [], connect: vi.fn(), ...overrides } as unknown as ReturnType<typeof useConnect>;
}

// Account Mocks
//
// `mockAccountData` deliberately keeps its own loose `MockAccountData` shape rather
// than `ReturnType<typeof useAccount>`: it's consumed inside the untyped
// `vi.mock("wagmi", ...)` factory below, and `.mockReturnValue()` on it is called
// directly with plain literals (MOCK_CONNECTED_ACCOUNT, etc.) by this file and
// others — those aren't checked against wagmi's real return type. `buildAccountData`
// (above) is the strictly-typed one, for call sites that mock the real imported
// `useAccount` hook directly via `vi.mocked(useAccount)`.
interface MockAccountData {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  status: "connected" | "reconnecting" | "connecting" | "disconnected";
  isConnecting: boolean;
  isDisconnected: boolean;
  isReconnecting: boolean;
  chainId?: number;
}

export const mockAccountData = vi.fn(
  (): MockAccountData => ({
    address: "0x123456789abcdef" as `0x${string}`,
    isConnected: false,
    status: "disconnected",
    isConnecting: false,
    isDisconnected: true,
    isReconnecting: false,
  }),
);

// Contract Mocks
export const mockReadContractData = vi.fn(() => ({
  data: undefined as unknown,
  error: null,
  isPending: false,
  isLoading: false,
  refetch: vi.fn(),
}));

export const mockWriteContractData = vi.fn(() => ({
  writeContract: vi.fn(),
  writeContractAsync: vi.fn(),
  isPending: false,
  error: null,
  data: undefined as unknown,
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
  useSimulateContract: vi.fn(() => ({ data: undefined })),
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
vi.mock("../hooks/useLocale", () => ({
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
