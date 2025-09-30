/**
 * LanguageToggle Component Tests
 *
 * Tests the URL generation logic for language switching to ensure correct path structure.
 * This specifically tests the fix for the 404 bug where English URLs were incorrectly
 * generated with /en/ prefix instead of using root paths.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageToggle from "../components/LanguageToggle";

// Mock the usePageContext hook with different URL scenarios
const mockUsePageContext = vi.fn();

vi.mock("vike-react/usePageContext", () => ({
  usePageContext: () => mockUsePageContext(),
}));

vi.mock("../locales/extractLocale", () => ({
  extractLocale: (pathname: string) => {
    // Simulate the extractLocale logic for testing
    if (pathname.startsWith("/de/")) {
      return {
        locale: "de",
        urlPathnameWithoutLocale: pathname.replace("/de", "") || "/",
      };
    }
    return {
      locale: "en",
      urlPathnameWithoutLocale: pathname,
    };
  },
}));

describe("LanguageToggle URL Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("URL Structure Fix (404 Bug)", () => {
    it("should generate correct English URLs without /en/ prefix", () => {
      // Test the specific bug: English should use root paths, not /en/ prefix
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/imagegen",
      });

      render(<LanguageToggle />);

      const enLink = screen.getByLabelText("Switch to English");
      const deLink = screen.getByLabelText("Switch to German");

      // English should use root path (matches build structure)
      expect(enLink).toHaveAttribute("href", "/imagegen");
      
      // German should use prefixed path (matches build structure)
      expect(deLink).toHaveAttribute("href", "/de/imagegen");
    });

    it("should generate correct URLs for root page", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/",
      });

      render(<LanguageToggle />);

      const enLink = screen.getByLabelText("Switch to English");
      const deLink = screen.getByLabelText("Switch to German");

      // Root page handling
      expect(enLink).toHaveAttribute("href", "/");
      expect(deLink).toHaveAttribute("href", "/de");
    });

    it("should generate correct URLs when already on German page", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/de/assistent",
      });

      render(<LanguageToggle />);

      const enLink = screen.getByLabelText("Switch to English");
      const deLink = screen.getByLabelText("Switch to German");

      // Switch from German to English: remove /de/ prefix
      expect(enLink).toHaveAttribute("href", "/assistent");
      
      // Stay on German: keep /de/ prefix
      expect(deLink).toHaveAttribute("href", "/de/assistent");
    });

    it("should handle deep nested paths correctly", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/blog/5",
      });

      render(<LanguageToggle />);

      const enLink = screen.getByLabelText("Switch to English");
      const deLink = screen.getByLabelText("Switch to German");

      // English: root path (no prefix)
      expect(enLink).toHaveAttribute("href", "/blog/5");
      
      // German: prefixed path
      expect(deLink).toHaveAttribute("href", "/de/blog/5");
    });
  });

  describe("Active State Indication", () => {
    it("should show correct active state for English", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/imagegen",
      });

      render(<LanguageToggle />);

      const enLink = screen.getByLabelText("Switch to English");
      const deLink = screen.getByLabelText("Switch to German");

      // English should be active (no visual test, but structure test)
      expect(enLink).toHaveAttribute("aria-current", "page");
      expect(deLink).not.toHaveAttribute("aria-current");
    });

    it("should show correct active state for German", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/de/imagegen",
      });

      render(<LanguageToggle />);

      const enLink = screen.getByLabelText("Switch to English");
      const deLink = screen.getByLabelText("Switch to German");

      // German should be active
      expect(deLink).toHaveAttribute("aria-current", "page");
      expect(enLink).not.toHaveAttribute("aria-current");
    });
  });

  describe("Build Structure Compatibility", () => {
    it("should generate URLs that match static build structure", () => {
      // This test documents the expected URL structure that matches
      // the static files generated during build
      
      const testCases = [
        {
          current: "/imagegen",
          expectedEn: "/imagegen", // Matches build/client/imagegen/index.html
          expectedDe: "/de/imagegen", // Matches build/client/de/imagegen/index.html
        },
        {
          current: "/assistent",
          expectedEn: "/assistent", // Matches build/client/assistent/index.html
          expectedDe: "/de/assistent", // Matches build/client/de/assistent/index.html
        },
        {
          current: "/blog",
          expectedEn: "/blog", // Matches build/client/blog/index.html
          expectedDe: "/de/blog", // Matches build/client/de/blog/index.html
        },
      ];

      testCases.forEach(({ current, expectedEn, expectedDe }) => {
        mockUsePageContext.mockReturnValue({
          urlOriginal: current,
        });

        const { rerender } = render(<LanguageToggle />);

        const enLink = screen.getByLabelText("Switch to English");
        const deLink = screen.getByLabelText("Switch to German");

        expect(enLink).toHaveAttribute("href", expectedEn);
        expect(deLink).toHaveAttribute("href", expectedDe);

        rerender(<div />); // Clean up for next iteration
      });
    });
  });
});