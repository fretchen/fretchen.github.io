/**
 * HeadDefault Component Tests
 *
 * Tests the <head> tag generation for SEO, specifically:
 * - Canonical tags point to the correct language version
 * - hreflang alternate tags only reference OTHER languages (no self-reference)
 * - x-default always points to English version
 *
 * This prevents Google Search Console errors like:
 * "Alternate page with proper canonical tag" caused by pages
 * marking themselves as alternates via self-referencing hreflang tags.
 *
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import HeadDefault from "../pages/+Head";

// Mock dependencies
const mockUsePageContext = vi.fn();

vi.mock("vike-react/usePageContext", () => ({
  usePageContext: () => mockUsePageContext(),
}));

vi.mock("../locales/extractLocale", () => ({
  extractLocale: (pathname: string) => {
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

vi.mock("../utils/siteData", () => ({
  getRelMeLinks: () => [],
  SITE: {
    url: "https://www.fretchen.eu",
  },
}));

vi.mock("../utils/analyticsConfig", () => ({
  analyticsConfig: {
    isDisabled: true,
  },
}));

vi.mock("../utils/pageContext", () => ({
  getPageUrl: (context: { urlOriginal?: string }) => context.urlOriginal || "/",
}));

// Mock the favicon import
vi.mock("../pages/image_3_1fc7cfc7b9e9.jpg", () => ({
  default: "/mock-favicon.jpg",
}));

describe("HeadDefault Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Canonical Tags", () => {
    it("English page canonical should point to itself (no /en/ prefix)", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('rel="canonical"');
      expect(html).toContain('href="https://www.fretchen.eu/blog/19/"');
    });

    it("German page canonical should point to itself (with /de/ prefix)", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/de/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('rel="canonical"');
      expect(html).toContain('href="https://www.fretchen.eu/de/blog/19/"');
    });

    it("Root English page canonical should be root", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('rel="canonical"');
      expect(html).toContain('href="https://www.fretchen.eu/"');
    });

    it("Root German page canonical should be /de/", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/de/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('rel="canonical"');
      expect(html).toContain('href="https://www.fretchen.eu/de/"');
    });
  });

  describe("hreflang Alternate Tags (No Self-Reference)", () => {
    it("English page should NOT have hreflang='en' alternate (no self-reference)", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      // Count how many times hrefLang="en" appears
      const enMatches = html.match(/hrefLang="en"/g);
      // Should be 0 because English page should not reference itself
      expect(enMatches).toBeNull();
    });

    it("English page should have hreflang='de' alternate pointing to German version", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('hrefLang="de"');
      expect(html).toContain('href="https://www.fretchen.eu/de/blog/19/"');
    });

    it("German page should NOT have hreflang='de' alternate (no self-reference)", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/de/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      // Count how many times hrefLang="de" appears
      const deMatches = html.match(/hrefLang="de"/g);
      // Should be 0 because German page should not reference itself
      expect(deMatches).toBeNull();
    });

    it("German page should have hreflang='en' alternate pointing to English version", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/de/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('hrefLang="en"');
      expect(html).toContain('href="https://www.fretchen.eu/blog/19/"');
    });
  });

  describe("x-default hreflang Tag", () => {
    it("English page should have x-default pointing to itself", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('hrefLang="x-default"');
      expect(html).toContain('href="https://www.fretchen.eu/blog/19/"');
    });

    it("German page should have x-default pointing to English version", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/de/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('hrefLang="x-default"');
      expect(html).toContain('href="https://www.fretchen.eu/blog/19/"');
    });
  });

  describe("Complete hreflang Structure", () => {
    it("English page should have exactly 2 hreflang alternates (de + x-default)", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      // Count hrefLang occurrences
      const hreflangMatches = html.match(/hrefLang="/g);
      expect(hreflangMatches?.length).toBe(2); // de + x-default (NOT en)

      expect(html).toContain('hrefLang="de"');
      expect(html).toContain('hrefLang="x-default"');
      // Should NOT have hrefLang="en"
      expect(html).not.toContain('hrefLang="en"');
    });

    it("German page should have exactly 2 hreflang alternates (en + x-default)", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/de/blog/19/",
      });

      const html = renderToString(<HeadDefault />);

      // Count hrefLang occurrences
      const hreflangMatches = html.match(/hrefLang="/g);
      expect(hreflangMatches?.length).toBe(2); // en + x-default (NOT de)

      expect(html).toContain('hrefLang="en"');
      expect(html).toContain('hrefLang="x-default"');
      // Should NOT have hrefLang="de"
      expect(html).not.toContain('hrefLang="de"');
    });
  });

  describe("Edge Cases", () => {
    it("Blog list page should have correct alternates", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/blog/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('rel="canonical"');
      expect(html).toContain('href="https://www.fretchen.eu/blog/"');

      // Should NOT have hrefLang="en"
      expect(html).not.toContain('hrefLang="en"');

      expect(html).toContain('hrefLang="de"');
      expect(html).toContain('href="https://www.fretchen.eu/de/blog/"');
    });

    it("German blog list page should have correct alternates", () => {
      mockUsePageContext.mockReturnValue({
        urlOriginal: "/de/blog/",
      });

      const html = renderToString(<HeadDefault />);

      expect(html).toContain('rel="canonical"');
      expect(html).toContain('href="https://www.fretchen.eu/de/blog/"');

      // Should NOT have hrefLang="de"
      expect(html).not.toContain('hrefLang="de"');

      expect(html).toContain('hrefLang="en"');
      expect(html).toContain('href="https://www.fretchen.eu/blog/"');
    });
  });
});
