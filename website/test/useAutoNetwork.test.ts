/**
 * Tests for useAutoNetwork hook using real wagmi with mock connector
 *
 * Uses wagmi's mock connector to test with different chainIds in one file.
 * See: https://wagmi.sh/react/api/connectors/mock
 *
 * IMPORTANT: The mock connector shares state between tests, so each test
 * must first reset to a known chain state before asserting.
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Disable global wagmi mocks from setup.ts
vi.unmock("wagmi");
vi.unmock("wagmi/connectors");

import { createConfig, WagmiProvider, http, useChainId, useSwitchChain, useAccount, useConnect } from "wagmi";
import { optimism, optimismSepolia, base, mainnet } from "wagmi/chains";
import { mock } from "wagmi/connectors";
import { useAutoNetwork } from "../hooks/useAutoNetwork";

// Test networks in CAIP-2 format
const OPTIMISM_MAINNET = "eip155:10";
const OPTIMISM_SEPOLIA = "eip155:11155420";
const BASE_MAINNET = "eip155:8453";

// Shared config - state persists between tests
const sharedConfig = createConfig({
  chains: [optimism, optimismSepolia, base, mainnet],
  connectors: [
    mock({
      accounts: ["0x1234567890123456789012345678901234567890"],
      features: { defaultConnected: true },
    }),
  ],
  transports: {
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

// Create test wrapper with shared config
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(WagmiProvider, { config: sharedConfig }, children),
    );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
}

describe("useAutoNetwork Hook", () => {
  describe("return value structure", () => {
    it("should return network, isOnCorrectNetwork, and switchIfNeeded", async () => {
      const wrapper = createTestWrapper();
      const supportedNetworks = [OPTIMISM_MAINNET, OPTIMISM_SEPOLIA];

      const { result } = renderHook(() => useAutoNetwork(supportedNetworks), { wrapper });

      await waitFor(() => {
        expect(result.current.network).toBeDefined();
      });

      expect(result.current).toHaveProperty("network");
      expect(result.current).toHaveProperty("isOnCorrectNetwork");
      expect(result.current).toHaveProperty("switchIfNeeded");
      expect(typeof result.current.switchIfNeeded).toBe("function");
    });
  });

  describe("when on Optimism mainnet (chainId=10)", () => {
    it("should return eip155:10 as current network", async () => {
      const wrapper = createTestWrapper();
      const supportedNetworks = [OPTIMISM_MAINNET, OPTIMISM_SEPOLIA];

      const { result } = renderHook(() => useAutoNetwork(supportedNetworks), { wrapper });

      await waitFor(() => {
        expect(result.current.network).toBe(OPTIMISM_MAINNET);
      });

      expect(result.current.isOnCorrectNetwork).toBe(true);
    });

    it("switchIfNeeded() should return true without switching", async () => {
      const wrapper = createTestWrapper();
      const supportedNetworks = [OPTIMISM_MAINNET];

      const { result } = renderHook(() => useAutoNetwork(supportedNetworks), { wrapper });

      await waitFor(() => {
        expect(result.current.network).toBeDefined();
      });

      let switched = false;
      await act(async () => {
        switched = await result.current.switchIfNeeded();
      });

      expect(switched).toBe(true);
    });
  });

  describe("when on Optimism Sepolia (chainId=11155420)", () => {
    it("should return eip155:11155420 as current network", async () => {
      const wrapper = createTestWrapper();

      // ALL hooks in ONE renderHook - same React tree
      const { result } = renderHook(
        () => ({
          autoNetwork: useAutoNetwork([OPTIMISM_MAINNET, OPTIMISM_SEPOLIA]),
          chainId: useChainId(),
          switchChain: useSwitchChain(),
        }),
        { wrapper },
      );

      // Wait for initial render
      await waitFor(() => {
        expect(result.current.chainId).toBe(10);
      });

      // Switch to Sepolia
      await act(async () => {
        result.current.switchChain.switchChain({ chainId: 11155420 });
      });

      await waitFor(() => {
        expect(result.current.chainId).toBe(11155420);
      });

      expect(result.current.autoNetwork.network).toBe(OPTIMISM_SEPOLIA);
      expect(result.current.autoNetwork.isOnCorrectNetwork).toBe(true);
    });
  });

  describe("when on Base mainnet (chainId=8453)", () => {
    it("should return eip155:8453 as current network when Base is supported", async () => {
      const wrapper = createTestWrapper();

      const { result } = renderHook(
        () => ({
          autoNetwork: useAutoNetwork([BASE_MAINNET, OPTIMISM_MAINNET]),
          switchChain: useSwitchChain(),
        }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.autoNetwork.network).toBeDefined();
      });

      // Switch to Base
      await act(async () => {
        result.current.switchChain.switchChain({ chainId: 8453 });
      });

      await waitFor(() => {
        expect(result.current.autoNetwork.network).toBe(BASE_MAINNET);
        expect(result.current.autoNetwork.isOnCorrectNetwork).toBe(true);
      });
    });
  });

  describe("when on unsupported network (chainId=1 Ethereum)", () => {
    it("should return default network (first in list)", async () => {
      const wrapper = createTestWrapper();

      const { result } = renderHook(
        () => ({
          autoNetwork: useAutoNetwork([OPTIMISM_MAINNET, OPTIMISM_SEPOLIA]),
          switchChain: useSwitchChain(),
        }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.autoNetwork.network).toBeDefined();
      });

      // Switch to Ethereum mainnet (unsupported)
      await act(async () => {
        result.current.switchChain.switchChain({ chainId: 1 });
      });

      await waitFor(() => {
        // Should return default (first supported network)
        expect(result.current.autoNetwork.network).toBe(OPTIMISM_MAINNET);
        expect(result.current.autoNetwork.isOnCorrectNetwork).toBe(false);
      });
    });

    it("switchIfNeeded() should switch to default network", async () => {
      const wrapper = createTestWrapper();

      const { result } = renderHook(
        () => ({
          autoNetwork: useAutoNetwork([OPTIMISM_MAINNET, OPTIMISM_SEPOLIA]),
          switchChain: useSwitchChain(),
          chainId: useChainId(),
          account: useAccount(),
          connect: useConnect(),
        }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.autoNetwork.network).toBeDefined();
      });

      // First: connect (mock connector is not auto-connected)
      await act(async () => {
        result.current.connect.connect({ connector: result.current.connect.connectors[0] });
      });
      await waitFor(() => {
        expect(result.current.account.isConnected).toBe(true);
      });

      // Reset to Optimism (in case previous tests left us elsewhere)
      await act(async () => {
        result.current.switchChain.switchChain({ chainId: 10 });
      });
      await waitFor(() => {
        expect(result.current.chainId).toBe(10);
      });

      // Switch to Ethereum mainnet (unsupported)
      await act(async () => {
        result.current.switchChain.switchChain({ chainId: 1 });
      });

      await waitFor(() => {
        expect(result.current.chainId).toBe(1);
      });

      // Now call switchIfNeeded - should switch back to Optimism
      await act(async () => {
        const switched = await result.current.autoNetwork.switchIfNeeded();
        expect(switched).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.chainId).toBe(10); // Optimism
      });
    });
  });

  describe("network switching behavior", () => {
    it("should NOT auto-switch on mount", async () => {
      const wrapper = createTestWrapper();

      const { result } = renderHook(
        () => ({
          autoNetwork: useAutoNetwork([OPTIMISM_SEPOLIA]), // Only Sepolia supported
          switchChain: useSwitchChain(),
          chainId: useChainId(),
        }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.autoNetwork.network).toBeDefined();
      });

      // Reset to Optimism (in case previous tests left us elsewhere)
      await act(async () => {
        result.current.switchChain.switchChain({ chainId: 10 });
      });
      await waitFor(() => {
        expect(result.current.chainId).toBe(10);
      });

      // Should still be on Optimism mainnet (10), NOT auto-switched
      expect(result.current.chainId).toBe(10);
      expect(result.current.autoNetwork.isOnCorrectNetwork).toBe(false);
    });

    it("switchIfNeeded() should switch when on wrong network", async () => {
      const wrapper = createTestWrapper();

      const { result } = renderHook(
        () => ({
          autoNetwork: useAutoNetwork([OPTIMISM_SEPOLIA]), // Only Sepolia supported
          switchChain: useSwitchChain(),
          chainId: useChainId(),
          account: useAccount(),
          connect: useConnect(),
        }),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.autoNetwork.network).toBeDefined();
      });

      // First: connect (mock connector is not auto-connected)
      await act(async () => {
        result.current.connect.connect({ connector: result.current.connect.connectors[0] });
      });
      await waitFor(() => {
        expect(result.current.account.isConnected).toBe(true);
      });

      // Reset to Optimism (in case previous tests left us elsewhere)
      await act(async () => {
        result.current.switchChain.switchChain({ chainId: 10 });
      });
      await waitFor(() => {
        expect(result.current.chainId).toBe(10);
      });

      // Currently on Optimism (10), but only Sepolia supported
      expect(result.current.chainId).toBe(10);
      expect(result.current.autoNetwork.isOnCorrectNetwork).toBe(false);

      // Call switchIfNeeded
      await act(async () => {
        const switched = await result.current.autoNetwork.switchIfNeeded();
        expect(switched).toBe(true);
      });

      // Should now be on Sepolia
      await waitFor(() => {
        expect(result.current.chainId).toBe(11155420);
        expect(result.current.autoNetwork.isOnCorrectNetwork).toBe(true);
      });
    });
  });
});
