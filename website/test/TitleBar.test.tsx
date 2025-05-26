import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TitleBar from "../components/TitleBar";

// Mock SupportArea da es komplexe Blockchain-Abhängigkeiten hat
vi.mock("../components/SupportArea", () => ({
  default: () => <div data-testid="support-area">Mocked Support Area</div>,
}));

/**
 * Component tests for the TitleBar component
 * Tests title rendering, layout structure, and edge cases
 *
 * @fileoverview Unit tests covering title display, SupportArea integration,
 * layout validation, and various title input scenarios for the TitleBar component
 */
describe("TitleBar Component", () => {
  /**
   * Tests title text rendering in heading element
   * @test {HTMLHeadingElement} heading - Title displayed in h1 element
   * @test {string} content - Title text content validation
   */
  it("renders title correctly", () => {
    const testTitle = "Test Page Title";
    render(<TitleBar title={testTitle} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(testTitle);
  });

  /**
   * Tests SupportArea component integration
   * @test {HTMLElement} supportArea - Mocked SupportArea component presence
   */
  it("includes SupportArea component", () => {
    render(<TitleBar title="Test Title" />);

    expect(screen.getByTestId("support-area")).toBeInTheDocument();
  });

  /**
   * Tests component layout structure and CSS styling
   * @test {HTMLElement} container - TitleBar container element
   * @test {CSSStyleDeclaration} styles - Layout CSS properties validation
   */
  it("has correct layout structure", () => {
    const { container } = render(<TitleBar title="Test Title" />);

    const titleBarDiv = container.querySelector(".TitleBar");
    expect(titleBarDiv).toBeInTheDocument();
    expect(titleBarDiv).toHaveStyle({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    });
  });

  /**
   * Tests handling of long title text without layout breaking
   * @test {string} longTitle - Very long title text input
   * @test {HTMLHeadingElement} heading - Title display with long text
   */
  it("handles long titles without breaking layout", () => {
    const longTitle = "This is a very long title that should still be displayed properly without breaking the layout";
    render(<TitleBar title={longTitle} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(longTitle);
  });

  /**
   * Tests handling of empty title string
   * @test {string} emptyTitle - Empty string as title input
   * @test {HTMLHeadingElement} heading - Heading element with empty content
   */
  it("handles empty title", () => {
    render(<TitleBar title="" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("");
  });

  /**
   * Tests handling of special characters in title
   * @test {string} specialTitle - Title with HTML entities and special characters
   * @test {HTMLHeadingElement} heading - Proper rendering of special characters
   */
  it("handles special characters in title", () => {
    const specialTitle = 'Title with & special <characters> and "quotes"';
    render(<TitleBar title={specialTitle} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(specialTitle);
  });
});
