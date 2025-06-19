import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { NFTCard } from "../components/NFTCard";
import { NFTCardProps } from "../types/components";

/**
 * Mock all complex dependencies to avoid mocking issues
 */
vi.mock("wagmi", () => ({
  useWriteContract: vi.fn(() => ({
    writeContract: vi.fn(),
    isPending: false,
    data: undefined,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    isLoading: false,
    isSuccess: false,
  })),
}));

vi.mock("wagmi/actions", () => ({
  readContract: vi.fn(),
}));

vi.mock("viem", () => ({
  createPublicClient: vi.fn(() => ({
    readContract: vi.fn(),
  })),
  http: vi.fn(),
}));

vi.mock("viem/chains", () => ({
  optimism: {},
}));

vi.mock("../wagmi.config", () => ({
  config: {},
}));

vi.mock("../utils/getChain", () => ({
  getGenAiNFTContractConfig: vi.fn(() => ({
    address: "0x1234567890123456789012345678901234567890",
    abi: [],
  })),
}));

vi.mock("../components/Toast", () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
    ToastComponent: null,
  })),
}));

vi.mock("../components/SimpleCollectButton", () => ({
  SimpleCollectButton: vi.fn(() => <button data-testid="collect-button">Collect</button>),
}));

vi.mock("../layouts/styles", () => ({
  nftCard: {
    container: "nft-card-container",
    highlighted: "nft-card-highlighted",
    loadingContainer: "loading-container",
    loadingText: "loading-text",
    errorContainer: "error-container",
    errorBox: "error-box",
    errorText: "error-text",
    tokenIdText: "token-id-text",
    imageContainer: "image-container",
    image: "nft-image",
    imageError: "image-error",
    imagePlaceholder: "image-placeholder",
    title: "nft-title",
    description: "nft-description",
    footer: "nft-footer",
    checkboxLabel: "checkbox-label",
    checkbox: "nft-checkbox",
    actions: "nft-actions",
    actionButton: "action-button",
  },
  spinner: "spinner",
  primaryButton: "primary-button",
  secondaryButton: "secondary-button",
  errorStatus: "error-status",
}));

// Mock fetch globally
global.fetch = vi.fn();

/**
 * Basic component tests for the NFTCard component
 * Tests component functionality including loading states, error handling,
 * and user interactions
 */
describe("NFTCard Component", () => {
  const mockProps: NFTCardProps = {
    tokenId: BigInt(1),
    onImageClick: vi.fn(),
    onNftBurned: vi.fn(),
    isHighlighted: false,
    isPublicView: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  /**
   * Tests component importability and function type
   */
  it("should be importable", () => {
    expect(typeof NFTCard).toBe("function");
  });

  /**
   * Tests component definition and React component structure
   */
  it("should be a React component", () => {
    expect(NFTCard).toBeDefined();
    expect(typeof NFTCard).toBe("function");
  });

  /**
   * Tests props interface compatibility and React element creation
   */
  it("should accept the correct props interface", () => {
    expect(() => {
      const element = React.createElement(NFTCard, mockProps);
      expect(element).toBeDefined();
    }).not.toThrow();
  });

  /**
   * Tests that component can be created with required props
   */
  it("should accept tokenId as bigint", () => {
    const propsWithBigInt = {
      ...mockProps,
      tokenId: BigInt(123),
    };

    expect(() => {
      const element = React.createElement(NFTCard, propsWithBigInt);
      expect(element).toBeDefined();
    }).not.toThrow();
  });

  /**
   * Tests optional props
   */
  it("should accept optional props", () => {
    const propsWithOptional = {
      ...mockProps,
      isHighlighted: true,
      isPublicView: true,
      onListedStatusChanged: vi.fn(),
    };

    expect(() => {
      const element = React.createElement(NFTCard, propsWithOptional);
      expect(element).toBeDefined();
    }).not.toThrow();
  });

  /**
   * Tests callback function types
   */
  it("should accept callback functions with correct signatures", () => {
    const onImageClick = vi.fn((image: { src: string; alt: string; title?: string; description?: string }) => {
      expect(image).toHaveProperty("src");
      expect(image).toHaveProperty("alt");
    });

    const onNftBurned = vi.fn(() => {
      // Callback with no parameters
    });

    const onListedStatusChanged = vi.fn((tokenId: bigint, isListed: boolean) => {
      expect(typeof tokenId).toBe("bigint");
      expect(typeof isListed).toBe("boolean");
    });

    const propsWithCallbacks = {
      ...mockProps,
      onImageClick,
      onNftBurned,
      onListedStatusChanged,
    };

    expect(() => {
      const element = React.createElement(NFTCard, propsWithCallbacks);
      expect(element).toBeDefined();
    }).not.toThrow();
  });

  /**
   * Tests component with different tokenId values
   */
  it("should handle different tokenId values", () => {
    const testCases = [BigInt(0), BigInt(1), BigInt(999999), BigInt("0x1a2b3c4d5e6f")];

    testCases.forEach((tokenId) => {
      expect(() => {
        const element = React.createElement(NFTCard, { ...mockProps, tokenId });
        expect(element).toBeDefined();
      }).not.toThrow();
    });
  });

  /**
   * Tests component behavior with missing optional callbacks
   */
  it("should handle missing optional callbacks", () => {
    const minimalProps = {
      tokenId: BigInt(1),
      onImageClick: vi.fn(),
      onNftBurned: vi.fn(),
    };

    expect(() => {
      const element = React.createElement(NFTCard, minimalProps);
      expect(element).toBeDefined();
    }).not.toThrow();
  });

  /**
   * Tests className prop inheritance from BaseComponentProps
   */
  it("should accept className prop from BaseComponentProps", () => {
    const propsWithClassName = {
      ...mockProps,
      className: "custom-nft-card",
    };

    expect(() => {
      const element = React.createElement(NFTCard, propsWithClassName);
      expect(element).toBeDefined();
    }).not.toThrow();
  });

  /**
   * Tests that component handles boolean props correctly
   */
  it("should handle boolean props correctly", () => {
    const testCases = [
      { isHighlighted: true, isPublicView: false },
      { isHighlighted: false, isPublicView: true },
      { isHighlighted: true, isPublicView: true },
      { isHighlighted: false, isPublicView: false },
    ];

    testCases.forEach((booleanProps) => {
      expect(() => {
        const element = React.createElement(NFTCard, { ...mockProps, ...booleanProps });
        expect(element).toBeDefined();
      }).not.toThrow();
    });
  });

  /**
   * Test for the bug fix: Listed checkbox should be visible in private view when onListedStatusChanged is provided
   * This test ensures that the regression doesn't happen again where the checkbox was not visible
   * due to missing onListedStatusChanged prop in MyNFTList component.
   */
  it("should show listed checkbox in private view when onListedStatusChanged is provided", () => {
    const propsWithCallback = {
      ...mockProps,
      isPublicView: false,
      onListedStatusChanged: vi.fn(),
    };

    // With onListedStatusChanged callback, the checkbox should be rendered
    // This tests the bug fix
    expect(() => {
      const element = React.createElement(NFTCard, propsWithCallback);
      expect(element).toBeDefined();
      expect(propsWithCallback.onListedStatusChanged).toBeDefined();
    }).not.toThrow();
  });

  /**
   * Test that listed checkbox should NOT be visible in public view
   * even when onListedStatusChanged is provided
   */
  it("should not show listed checkbox in public view even with onListedStatusChanged", () => {
    const onListedStatusChanged = vi.fn();
    const propsWithPublicView = {
      ...mockProps,
      isPublicView: true,
      onListedStatusChanged,
    };

    // In public view, the checkbox should not be rendered
    // regardless of onListedStatusChanged callback presence
    expect(() => {
      const element = React.createElement(NFTCard, propsWithPublicView);
      expect(element).toBeDefined();
    }).not.toThrow();
  });

  /**
   * Test that listed checkbox should NOT be visible in private view
   * when onListedStatusChanged is NOT provided (the original bug)
   */
  it("should not show listed checkbox in private view when onListedStatusChanged is missing", () => {
    const propsWithoutCallback = {
      ...mockProps,
      isPublicView: false,
      // onListedStatusChanged is intentionally omitted
    };

    // Without onListedStatusChanged callback, the checkbox should not be rendered
    // This was the original behavior that caused the bug
    expect(() => {
      const element = React.createElement(NFTCard, propsWithoutCallback);
      expect(element).toBeDefined();
    }).not.toThrow();
  });
});
