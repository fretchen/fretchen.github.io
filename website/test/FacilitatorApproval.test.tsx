import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import {
  mockAccountData,
  mockReadContractData,
  mockWriteContractData,
  mockChainId,
  mockSwitchChainAsync,
  mockConnectedWallet,
  mockDisconnectedWallet,
  MOCK_CONNECTED_ACCOUNT,
} from "./setup";

// Mock @fretchen/chain-utils
vi.mock("@fretchen/chain-utils", () => ({
  getUSDCConfig: vi.fn((network: string) => {
    const configs: Record<string, object> = {
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
      "eip155:11155420": {
        name: "OP Sepolia",
        chainId: 11155420,
        address: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
        decimals: 6,
        usdcName: "USDC",
        usdcVersion: "2",
      },
      "eip155:84532": {
        name: "Base Sepolia",
        chainId: 84532,
        address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        decimals: 6,
        usdcName: "USDC",
        usdcVersion: "2",
      },
    };
    const config = configs[network];
    if (!config) throw new Error(`Unsupported network: ${network}`);
    return config;
  }),
  fromCAIP2: vi.fn((network: string) => {
    const map: Record<string, number> = {
      "eip155:10": 10,
      "eip155:8453": 8453,
      "eip155:11155420": 11155420,
      "eip155:84532": 84532,
    };
    return map[network] ?? 0;
  }),
}));

// Mock PandaCSS
vi.mock("../styled-system/css", () => ({
  css: vi.fn((..._args: unknown[]) => "mock-css-class"),
}));

// Mock global fetch for /supported endpoint
const MOCK_SUPPORTED_RESPONSE = {
  kinds: [
    { x402Version: 2, scheme: "exact", network: "eip155:10" },
    { x402Version: 2, scheme: "exact", network: "eip155:8453" },
  ],
  extensions: [
    {
      name: "facilitator_fee",
      fee: {
        amount: "10000",
        recipient: "0xFacilitatorAddress1234567890123456789012",
      },
    },
  ],
};

const FACILITATOR_ADDRESS = "0xFacilitatorAddress1234567890123456789012";

describe("FacilitatorApproval", () => {
  let mockWriteContract: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteContract = vi.fn();
    mockWriteContractData.mockReturnValue({
      writeContract: mockWriteContract,
      writeContractAsync: vi.fn(),
      isPending: false,
      error: null,
      data: undefined,
    });
    mockReadContractData.mockReturnValue({
      data: undefined,
      error: null,
      isPending: false,
      isLoading: false,
      refetch: vi.fn(),
    });

    // Default: successful /supported fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_SUPPORTED_RESPONSE),
    });
  });

  // ─── Import dynamically so mocks are in place ──────────────────────

  async function importComponent() {
    const mod = await import("../components/FacilitatorApproval");
    return mod;
  }

  // ─── Disconnected state ────────────────────────────────────────────

  describe("when wallet is disconnected", () => {
    beforeEach(() => {
      mockDisconnectedWallet();
    });

    it("shows connect hint", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);
      expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
    });

    it("does not show network selector", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);
      expect(screen.queryByText("Optimism")).not.toBeInTheDocument();
      expect(screen.queryByText("Base")).not.toBeInTheDocument();
    });
  });

  // ─── Connected state ───────────────────────────────────────────────

  describe("when wallet is connected", () => {
    beforeEach(() => {
      mockConnectedWallet();
      mockChainId.mockReturnValue(10);
      mockAccountData.mockReturnValue({
        ...MOCK_CONNECTED_ACCOUNT,
        chainId: 10,
      });
    });

    it("shows network selector with Optimism and Base", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);
      expect(screen.getByText("Optimism")).toBeInTheDocument();
      expect(screen.getByText("Base")).toBeInTheDocument();
    });

    it("does not show testnets by default", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);
      expect(screen.queryByText("OP Sepolia")).not.toBeInTheDocument();
      expect(screen.queryByText("Base Sepolia")).not.toBeInTheDocument();
    });

    it("shows testnets when showTestnets=true", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} showTestnets />);
      expect(screen.getByText("Optimism")).toBeInTheDocument();
      expect(screen.getByText("Base")).toBeInTheDocument();
      expect(screen.getByText("OP Sepolia")).toBeInTheDocument();
      expect(screen.getByText("Base Sepolia")).toBeInTheDocument();
    });

    it("shows approval label with OP Mainnet by default", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);
      expect(screen.getByText(/Your current USDC approval on OP Mainnet/)).toBeInTheDocument();
    });

    it("shows preset buttons (1 USDC, 10 USDC, Revoke)", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);
      expect(screen.getByText("1 USDC")).toBeInTheDocument();
      expect(screen.getByText("10 USDC")).toBeInTheDocument();
      expect(screen.getByText("Revoke")).toBeInTheDocument();
    });

    it("shows facilitator address", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);
      expect(screen.getByText(FACILITATOR_ADDRESS)).toBeInTheDocument();
    });

    it("displays USDC contract address for Optimism", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);
      expect(screen.getByText(/0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85/)).toBeInTheDocument();
    });
  });

  // ─── Network switching ─────────────────────────────────────────────

  describe("network switching", () => {
    beforeEach(() => {
      mockConnectedWallet();
      mockChainId.mockReturnValue(10);
      mockAccountData.mockReturnValue({
        ...MOCK_CONNECTED_ACCOUNT,
        chainId: 10,
      });
    });

    it("switches displayed USDC address when selecting Base", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      // Initially shows Optimism USDC
      expect(screen.getByText(/0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85/)).toBeInTheDocument();

      // Click Base
      fireEvent.click(screen.getByText("Base"));

      // Now shows Base USDC address
      expect(screen.getByText(/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/)).toBeInTheDocument();
    });

    it("shows Base name in approval label after switching", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      fireEvent.click(screen.getByText("Base"));
      // "Base" appears in the network label text
      expect(screen.getByText(/Your current USDC approval on Base/)).toBeInTheDocument();
    });

    it("shows testnet USDC address when selecting OP Sepolia", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} showTestnets />);

      fireEvent.click(screen.getByText("OP Sepolia"));
      expect(screen.getByText(/0x5fd84259d66Cd46123540766Be93DFE6D43130D7/)).toBeInTheDocument();
    });

    it("switches chain when approving on a different network", async () => {
      // Wallet is on Optimism (chainId 10), user selects Base (chainId 8453)
      mockSwitchChainAsync.mockResolvedValue(undefined);

      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      // Select Base
      fireEvent.click(screen.getByText("Base"));

      // Click approve 1 USDC
      fireEvent.click(screen.getByText("1 USDC"));

      await waitFor(() => {
        expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: 8453 });
      });
    });

    it("does not switch chain when already on selected network", async () => {
      // Wallet is on Optimism, selected network is Optimism
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      // Click approve (Optimism is default, wallet is on Optimism)
      fireEvent.click(screen.getByText("1 USDC"));

      await waitFor(() => {
        expect(mockSwitchChainAsync).not.toHaveBeenCalled();
      });
    });
  });

  // ─── Approve calls ─────────────────────────────────────────────────

  describe("approve calls", () => {
    beforeEach(() => {
      mockConnectedWallet();
      mockChainId.mockReturnValue(10);
      mockAccountData.mockReturnValue({
        ...MOCK_CONNECTED_ACCOUNT,
        chainId: 10,
      });
    });

    it("calls writeContract with Optimism USDC address for Optimism", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      fireEvent.click(screen.getByText("1 USDC"));

      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalledWith(
          expect.objectContaining({
            address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
            chainId: 10,
          })
        );
      });
    });

    it("calls writeContract with Base USDC address when Base is selected", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      // Switch to Base
      fireEvent.click(screen.getByText("Base"));

      // Simulate wallet now on Base
      mockAccountData.mockReturnValue({
        ...MOCK_CONNECTED_ACCOUNT,
        chainId: 8453,
      });

      fireEvent.click(screen.getByText("10 USDC"));

      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalledWith(
          expect.objectContaining({
            address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            chainId: 8453,
          })
        );
      });
    });

    it("calls writeContract with amount 0 for revoke", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      fireEvent.click(screen.getByText("Revoke"));

      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalledWith(
          expect.objectContaining({
            functionName: "approve",
            args: expect.arrayContaining([expect.anything(), 0n]),
          })
        );
      });
    });
  });

  // ─── Fetch facilitator address ─────────────────────────────────────

  describe("facilitator address fetching", () => {
    beforeEach(() => {
      mockConnectedWallet();
      mockChainId.mockReturnValue(10);
      mockAccountData.mockReturnValue({
        ...MOCK_CONNECTED_ACCOUNT,
        chainId: 10,
      });
    });

    it("fetches facilitator address from /supported when not provided", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "https://facilitator.fretchen.eu/supported",
          expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
      });
    });

    it("uses provided facilitator address without fetching", async () => {
      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={"0xProvided" as `0x${string}`} />);

      // fetch should not be called for /supported
      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });

      expect(screen.getByText("0xProvided")).toBeInTheDocument();
    });

    it("shows error when /supported fetch fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval />);

      await waitFor(() => {
        expect(screen.getByText(/could not load facilitator address/i)).toBeInTheDocument();
      });
    });

    it("shows error when /supported response has no fee extension", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ kinds: [], extensions: [] }),
      });

      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval />);

      await waitFor(() => {
        expect(screen.getByText(/could not load facilitator address/i)).toBeInTheDocument();
      });
    });
  });

  // ─── getNetworkUSDCConfig helper ───────────────────────────────────

  describe("getNetworkUSDCConfig", () => {
    it("returns config for Optimism", async () => {
      const { getNetworkUSDCConfig } = await importComponent();
      const config = getNetworkUSDCConfig("eip155:10");
      expect(config).not.toBeNull();
      expect(config!.chainId).toBe(10);
      expect(config!.address).toBe("0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85");
    });

    it("returns config for Base", async () => {
      const { getNetworkUSDCConfig } = await importComponent();
      const config = getNetworkUSDCConfig("eip155:8453");
      expect(config).not.toBeNull();
      expect(config!.chainId).toBe(8453);
      expect(config!.address).toBe("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
    });

    it("returns null for unsupported network", async () => {
      const { getNetworkUSDCConfig } = await importComponent();
      const config = getNetworkUSDCConfig("eip155:999999");
      expect(config).toBeNull();
    });
  });

  // ─── Transaction state ─────────────────────────────────────────────

  describe("transaction states", () => {
    beforeEach(() => {
      mockConnectedWallet();
      mockChainId.mockReturnValue(10);
      mockAccountData.mockReturnValue({
        ...MOCK_CONNECTED_ACCOUNT,
        chainId: 10,
      });
    });

    it("shows pending state when approval is in progress", async () => {
      mockWriteContractData.mockReturnValue({
        writeContract: vi.fn(),
        writeContractAsync: vi.fn(),
        isPending: true,
        error: null,
        data: undefined,
      });

      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      expect(screen.getByText(/confirm in your wallet/i)).toBeInTheDocument();
    });

    it("disables buttons when approval is pending", async () => {
      mockWriteContractData.mockReturnValue({
        writeContract: vi.fn(),
        writeContractAsync: vi.fn(),
        isPending: true,
        error: null,
        data: undefined,
      });

      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      expect(screen.getByText("1 USDC")).toBeDisabled();
      expect(screen.getByText("10 USDC")).toBeDisabled();
      expect(screen.getByText("Revoke")).toBeDisabled();
    });

    it("shows formatted allowance when data is available", async () => {
      mockReadContractData.mockReturnValue({
        data: 5000000n, // 5 USDC
        error: null,
        isPending: false,
        isLoading: false,
        refetch: vi.fn(),
      });

      const { FacilitatorApproval } = await importComponent();
      render(<FacilitatorApproval facilitatorAddress={FACILITATOR_ADDRESS as `0x${string}`} />);

      expect(screen.getByText("5 USDC")).toBeInTheDocument();
    });
  });

  // ─── Network constants ─────────────────────────────────────────────

  describe("exported constants", () => {
    it("APPROVAL_NETWORKS contains Optimism and Base", async () => {
      const { APPROVAL_NETWORKS } = await importComponent();
      expect(APPROVAL_NETWORKS).toHaveLength(2);
      expect(APPROVAL_NETWORKS[0].network).toBe("eip155:10");
      expect(APPROVAL_NETWORKS[1].network).toBe("eip155:8453");
    });

    it("APPROVAL_NETWORKS_WITH_TESTNETS includes all 4 networks", async () => {
      const { APPROVAL_NETWORKS_WITH_TESTNETS } = await importComponent();
      expect(APPROVAL_NETWORKS_WITH_TESTNETS).toHaveLength(4);
      const networks = APPROVAL_NETWORKS_WITH_TESTNETS.map((n: { network: string }) => n.network);
      expect(networks).toContain("eip155:10");
      expect(networks).toContain("eip155:8453");
      expect(networks).toContain("eip155:11155420");
      expect(networks).toContain("eip155:84532");
    });
  });
});
