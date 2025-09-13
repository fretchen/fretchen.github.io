import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock wagmi hooks that are used in components
vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({
    address: "0x123456789abcdef",
    isConnected: false,
  })),
  useSignMessage: vi.fn(() => ({
    signMessageAsync: vi.fn(),
  })),
  useReadContract: vi.fn(() => ({
    data: undefined,
    error: null,
    isPending: false,
    refetch: vi.fn(),
  })),
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn(),
    writeContractAsync: vi.fn(),
    isPending: false,
    error: null,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
  })),
  useChainId: vi.fn(() => 10),
  useSwitchChain: vi.fn(() => ({
    switchChain: vi.fn(),
    chains: [],
  })),
  useConnect: vi.fn(() => ({
    connectors: [],
    connect: vi.fn(),
  })),
  useDisconnect: vi.fn(() => ({
    disconnect: vi.fn(),
  })),
  useEnsName: vi.fn(() => ({
    data: null,
  })),
  createConfig: vi.fn(() => ({})),
  http: vi.fn(),
  WagmiProvider: vi.fn(({ children }) => children),
}));

// Mock wagmi/chains
vi.mock("wagmi/chains", () => ({
  mainnet: { id: 1, name: "Ethereum" },
  sepolia: { id: 11155111, name: "Sepolia" },
  optimism: { id: 10, name: "Optimism" },
  optimismSepolia: { id: 11155420, name: "Optimism Sepolia" },
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

// No need to mock utils/getChain - it's just reading env vars and returning constants
// The real implementation works fine in tests and ensures we test realistic configurations

// Mock useLocale hook
vi.mock("./hooks/useLocale", () => ({
  useLocale: vi.fn(({ label }: { label: string }) => label),
}));

// Clean up after each test
afterEach(() => {
  cleanup();
});
