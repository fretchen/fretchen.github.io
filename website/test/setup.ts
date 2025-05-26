import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock wagmi hooks that are used in components
vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({
    address: "0x123456789abcdef",
    isConnected: false,
  })),
  useReadContract: vi.fn(() => ({
    data: undefined,
    error: null,
    isPending: false,
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
}));

// Mock vike-react hooks
vi.mock("vike-react/usePageContext", () => ({
  usePageContext: vi.fn(() => ({
    urlPathname: "/test",
    routeParams: { id: "0" },
  })),
}));

// Mock utils
vi.mock("./utils/getChain", () => ({
  getChain: vi.fn(() => ({
    id: 10,
    name: "Optimism",
  })),
  getGenAiNFTContractConfig: vi.fn(() => ({
    address: "0xTestContract",
    abi: [],
  })),
  getSupportContractConfig: vi.fn(() => ({
    address: "0xSupportContract",
    abi: [],
  })),
}));

// Clean up after each test
afterEach(() => {
  cleanup();
});
