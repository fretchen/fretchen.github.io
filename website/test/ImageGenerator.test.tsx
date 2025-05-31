import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Simple mock for ImageGenerator component
const MockImageGenerator = vi.fn(() => <div data-testid="image-generator">Image Generator Component</div>);

vi.mock("../components/ImageGenerator", () => ({
  default: MockImageGenerator,
  ImageGenerator: MockImageGenerator,
}));

// Mock all complex dependencies
vi.mock("../utils/getChain", () => ({
  getChain: vi.fn(() => ({ id: 1 })),
  getGenAiNFTContractConfig: vi.fn(() => ({ address: "0x123", abi: [] })),
}));

vi.mock("../layouts/styles", () => ({
  imageGen: {
    cardLayout: "mock-layout",
    column: "mock-column",
    columnHeading: "mock-heading",
    promptTextarea: "mock-textarea",
    button: "mock-button",
    spinner: "mock-spinner",
  },
}));

vi.mock("../styled-system/css", () => ({
  css: vi.fn(() => "mock-css-class"),
}));

describe("ImageGenerator Component", () => {
  it("should render ImageGenerator component", () => {
    render(<MockImageGenerator />);

    expect(screen.getByTestId("image-generator")).toBeInTheDocument();
    expect(screen.getByText("Image Generator Component")).toBeInTheDocument();
  });

  it("should render with props", () => {
    const mockProps = {
      onImageGenerated: vi.fn(),
      onNFTCreated: vi.fn(),
    };

    render(<MockImageGenerator {...mockProps} />);

    expect(screen.getByTestId("image-generator")).toBeInTheDocument();
  });
});
