/**
 * extractLocale Unit Tests
 *
 * Tests the locale extraction and URL normalization logic.
 * Specifically tests trailing slash consistency to prevent
 * "Duplicate without user-selected canonical" SEO issues.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
 */

import { describe, it, expect } from "vitest";
import { extractLocale } from "../locales/extractLocale";

describe("extractLocale", () => {
  describe("basic locale extraction", () => {
    it("should extract default locale for English paths", () => {
      const result = extractLocale("/imagegen");
      expect(result.locale).toBe("en");
      expect(result.urlPathnameWithoutLocale).toBe("/imagegen/");
    });

    it("should extract German locale and remove prefix", () => {
      const result = extractLocale("/de/imagegen");
      expect(result.locale).toBe("de");
      expect(result.urlPathnameWithoutLocale).toBe("/imagegen/");
    });

    it("should handle root path", () => {
      const result = extractLocale("/");
      expect(result.locale).toBe("en");
      expect(result.urlPathnameWithoutLocale).toBe("/");
    });

    it("should handle German root path", () => {
      const result = extractLocale("/de");
      expect(result.locale).toBe("de");
      expect(result.urlPathnameWithoutLocale).toBe("/");
    });
  });

  describe("trailing slash consistency (SEO canonical URL fix)", () => {
    /**
     * These tests verify that trailing slashes are handled consistently.
     * GitHub Pages always adds trailing slashes, so our canonical URLs
     * should always include them to avoid duplicate content issues.
     *
     * Problem: Google reported "Duplicate without user-selected canonical" for:
     * - http://www.fretchen.eu/imagegen/
     * - http://www.fretchen.eu/blog/
     *
     * Root cause: URLs with and without trailing slash generated different
     * canonical URLs, causing Google to see them as duplicates.
     */

    it("should handle /imagegen and /imagegen/ consistently", () => {
      const withSlash = extractLocale("/imagegen/");
      const withoutSlash = extractLocale("/imagegen");

      // Both should return the same urlPathnameWithoutLocale
      expect(withSlash.urlPathnameWithoutLocale).toBe(withoutSlash.urlPathnameWithoutLocale);
      expect(withSlash.locale).toBe(withoutSlash.locale);
    });

    it("should handle /de/imagegen and /de/imagegen/ consistently", () => {
      const withSlash = extractLocale("/de/imagegen/");
      const withoutSlash = extractLocale("/de/imagegen");

      expect(withSlash.urlPathnameWithoutLocale).toBe(withoutSlash.urlPathnameWithoutLocale);
      expect(withSlash.locale).toBe("de");
      expect(withoutSlash.locale).toBe("de");
    });

    it("should handle /blog and /blog/ consistently", () => {
      const withSlash = extractLocale("/blog/");
      const withoutSlash = extractLocale("/blog");

      expect(withSlash.urlPathnameWithoutLocale).toBe(withoutSlash.urlPathnameWithoutLocale);
    });

    it("should handle deep paths with trailing slash consistently", () => {
      const withSlash = extractLocale("/blog/5/");
      const withoutSlash = extractLocale("/blog/5");

      expect(withSlash.urlPathnameWithoutLocale).toBe(withoutSlash.urlPathnameWithoutLocale);
    });

    it("should handle /de/blog/5 and /de/blog/5/ consistently", () => {
      const withSlash = extractLocale("/de/blog/5/");
      const withoutSlash = extractLocale("/de/blog/5");

      expect(withSlash.urlPathnameWithoutLocale).toBe(withoutSlash.urlPathnameWithoutLocale);
      expect(withSlash.locale).toBe("de");
    });

    it("should always include trailing slash for non-root paths (GitHub Pages convention)", () => {
      // GitHub Pages always serves URLs with trailing slashes
      // Our canonical URLs should match this behavior
      const paths = ["/imagegen", "/blog", "/assistent", "/blog/5", "/quantum/amo"];

      for (const path of paths) {
        const result = extractLocale(path);
        expect(
          result.urlPathnameWithoutLocale.endsWith("/"),
          `Expected "${result.urlPathnameWithoutLocale}" to end with "/" for input "${path}"`
        ).toBe(true);
      }
    });

    it("should always include trailing slash for German paths", () => {
      const paths = ["/de/imagegen", "/de/blog", "/de/assistent"];

      for (const path of paths) {
        const result = extractLocale(path);
        expect(
          result.urlPathnameWithoutLocale.endsWith("/"),
          `Expected "${result.urlPathnameWithoutLocale}" to end with "/" for input "${path}"`
        ).toBe(true);
      }
    });

    it("should keep root path as single slash", () => {
      // Root path should remain "/" not "//"
      const result = extractLocale("/");
      expect(result.urlPathnameWithoutLocale).toBe("/");

      const deResult = extractLocale("/de");
      expect(deResult.urlPathnameWithoutLocale).toBe("/");

      const deSlashResult = extractLocale("/de/");
      expect(deSlashResult.urlPathnameWithoutLocale).toBe("/");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = extractLocale("");
      expect(result.urlPathnameWithoutLocale).toBe("/");
    });

    it("should handle double slashes", () => {
      const result = extractLocale("//");
      expect(result.urlPathnameWithoutLocale).toBe("/");
    });

    it("should handle paths with query strings", () => {
      // Note: This tests current behavior - query strings may need special handling
      const result = extractLocale("/imagegen?foo=bar");
      expect(result.locale).toBe("en");
    });
  });
});
