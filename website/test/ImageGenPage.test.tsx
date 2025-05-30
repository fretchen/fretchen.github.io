import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Page from "../pages/imagegen/+Page";

// Mock the child components
vi.mock("../components/ImageGenerator", () => ({
  default: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (tokenId: bigint, imageUrl: string) => void;
    onError: (error: string) => void;
  }) => (
    <div data-testid="image-generator">
      <button onClick={() => onSuccess(1n, "test-image.png")}>Test Success</button>
      <button onClick={() => onError("test error")}>Test Error</button>
      Image Generator Mock
    </div>
  ),
}));

vi.mock("../components/NFTList", () => ({
  default: () => <div data-testid="nft-list">NFT List Mock</div>,
}));

// Mock styles
vi.mock("../layouts/styles", () => ({
  container: "mock-container-class",
  heading: "mock-heading-class",
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe("ImageGen Page", () => {
  it("should render all main components", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <TestWrapper>
        <Page />
      </TestWrapper>,
    );

    // Check if all main elements are rendered
    expect(screen.getByText("Decentral AI Image Generator")).toBeInTheDocument();
    expect(screen.getByTestId("image-generator")).toBeInTheDocument();
    expect(screen.getByTestId("nft-list")).toBeInTheDocument();

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should handle success callback from ImageGenerator", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    render(
      <TestWrapper>
        <Page />
      </TestWrapper>,
    );

    // Click the success button in the mocked ImageGenerator
    const successButton = screen.getByText("Test Success");
    successButton.click();

    expect(consoleSpy).toHaveBeenCalledWith("Image generation succeeded:", {
      tokenId: 1n,
      imageUrl: "test-image.png",
    });

    consoleSpy.mockRestore();
  });

  it("should handle error callback from ImageGenerator", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <TestWrapper>
        <Page />
      </TestWrapper>,
    );

    // Click the error button in the mocked ImageGenerator
    const errorButton = screen.getByText("Test Error");
    errorButton.click();

    expect(consoleErrorSpy).toHaveBeenCalledWith("Image generation failed:", "test error");

    consoleErrorSpy.mockRestore();
  });

  it("should have proper component structure", () => {
    render(
      <TestWrapper>
        <Page />
      </TestWrapper>,
    );

    // Check if the components are in the expected order
    const container = screen.getByText("Decentral AI Image Generator").parentElement;
    expect(container).toHaveClass("mock-container-class");

    const heading = screen.getByText("Decentral AI Image Generator");
    expect(heading).toHaveClass("mock-heading-class");
  });
});
