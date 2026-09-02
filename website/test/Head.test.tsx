/**
 * HeadDefault Component Tests
 *
 * Covers the <head> tags that decide how Google treats the /de/ URLs:
 * - hreflang is declared ONLY for genuinely translated pages, and each version lists itself
 * - an untranslated /de/ page canonicalises to its English original instead of competing
 *
 * The site renders /de/ for every route, but locales/de.ts only translates the imagegen and
 * assistent namespaces — everywhere else the body stays English and only the chrome changes.
 * Claiming a German alternate for all ~84 URLs is the boilerplate-translation pattern Google
 * names explicitly, and it produced duplicate-content signals in Search Console.
 *
 * Note the self-reference: it was previously omitted on purpose, to chase the GSC status
 * "Alternate page with proper canonical tag". That status is informational — it means Google
 * understood the alternates — and Google's requirement is the opposite: "each language version
 * must list itself as well as all other language versions".
 *
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 * @see locales/locales.ts — localizedPaths
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

// locales/locales.ts is deliberately NOT mocked — these tests assert against the real
// localizedPaths list, so adding a page there without translating it fails here.
const render = (urlOriginal: string) => {
  mockUsePageContext.mockReturnValue({ urlOriginal });
  return renderToString(<HeadDefault />);
};

const countHreflang = (html: string) => html.match(/hrefLang="/g)?.length ?? 0;

describe("HeadDefault Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Canonical tags", () => {
    it("points a translated English page at itself", () => {
      expect(render("/imagegen/")).toContain('rel="canonical" href="https://www.fretchen.eu/imagegen/"');
    });

    it("points a translated German page at itself", () => {
      expect(render("/de/imagegen/")).toContain('rel="canonical" href="https://www.fretchen.eu/de/imagegen/"');
    });

    it("points an untranslated English page at itself", () => {
      expect(render("/blog/19/")).toContain('rel="canonical" href="https://www.fretchen.eu/blog/19/"');
    });

    it("points an untranslated German page at the ENGLISH original", () => {
      // The German blog post is English prose with German chrome. Canonicalising it to the
      // English URL consolidates the duplicate instead of letting the two compete.
      expect(render("/de/blog/19/")).toContain('rel="canonical" href="https://www.fretchen.eu/blog/19/"');
    });

    it("does not pair the canonical with a noindex (contradictory signals)", () => {
      expect(render("/de/blog/19/")).not.toContain("noindex");
    });

    it("canonicalises the untranslated German homepage to the English root", () => {
      expect(render("/de/")).toContain('rel="canonical" href="https://www.fretchen.eu/"');
    });
  });

  describe("hreflang on translated pages", () => {
    it("declares en, de and x-default — including the self-reference — on the English version", () => {
      const html = render("/imagegen/");

      expect(countHreflang(html)).toBe(3);
      expect(html).toContain('hrefLang="en" href="https://www.fretchen.eu/imagegen/"');
      expect(html).toContain('hrefLang="de" href="https://www.fretchen.eu/de/imagegen/"');
      expect(html).toContain('hrefLang="x-default" href="https://www.fretchen.eu/imagegen/"');
    });

    it("declares the identical set on the German version", () => {
      const html = render("/de/imagegen/");

      expect(countHreflang(html)).toBe(3);
      expect(html).toContain('hrefLang="en" href="https://www.fretchen.eu/imagegen/"');
      expect(html).toContain('hrefLang="de" href="https://www.fretchen.eu/de/imagegen/"');
      expect(html).toContain('hrefLang="x-default" href="https://www.fretchen.eu/imagegen/"');
    });

    it("covers the assistent page too", () => {
      expect(countHreflang(render("/assistent/"))).toBe(3);
    });
  });

  describe("hreflang on untranslated pages", () => {
    it.each(["/blog/19/", "/de/blog/19/", "/quantum/basics/2/", "/x402/sellers/", "/", "/de/"])(
      "emits no alternates for %s",
      (url) => {
        expect(countHreflang(render(url))).toBe(0);
      },
    );
  });
});
