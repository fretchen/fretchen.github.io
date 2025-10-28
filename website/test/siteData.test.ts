import { describe, it, expect } from "vitest";
import { SITE, SOCIAL_LINKS, getSocialLinks, getRelMeLinks, getPersonSchema } from "../utils/siteData";

describe("siteData", () => {
  describe("SITE constant", () => {
    it("should have all required site properties", () => {
      expect(SITE.name).toBe("fretchen");
      expect(SITE.url).toBe("https://www.fretchen.eu");
      expect(SITE.description).toBeTruthy();
      expect(SITE.tagline).toBeTruthy();
    });

    it("should have valid URL format", () => {
      expect(SITE.url).toMatch(/^https?:\/\/.+/);
    });
  });

  describe("SOCIAL_LINKS constant", () => {
    it("should have at least 3 social platforms", () => {
      expect(SOCIAL_LINKS.length).toBeGreaterThanOrEqual(3);
    });

    it("should include mastodon, github, and bluesky", () => {
      const platforms = SOCIAL_LINKS.map((link) => link.platform);
      expect(platforms).toContain("mastodon");
      expect(platforms).toContain("github");
      expect(platforms).toContain("bluesky");
    });

    it("should have valid structure for each link", () => {
      SOCIAL_LINKS.forEach((link) => {
        expect(link.platform).toBeTruthy();
        expect(link.url).toMatch(/^https?:\/\/.+/);
        expect(link.handle).toBeTruthy();
        expect(link.icon).toBeTruthy();
        expect(link.label).toBeTruthy();
        expect(typeof link.relMe).toBe("boolean");
      });
    });

    it("should have atprotoUrl for bluesky", () => {
      const bluesky = SOCIAL_LINKS.find((link) => link.platform === "bluesky");
      expect(bluesky).toBeDefined();
      if (bluesky && "atprotoUrl" in bluesky) {
        expect(bluesky.atprotoUrl).toMatch(/^https?:\/\/.+/);
      }
    });
  });

  describe("getSocialLinks()", () => {
    it("should return all social links", () => {
      const links = getSocialLinks();
      expect(links).toEqual(SOCIAL_LINKS);
      expect(links.length).toBe(SOCIAL_LINKS.length);
    });
  });

  describe("getRelMeLinks()", () => {
    it("should return only links with relMe=true", () => {
      const relMeLinks = getRelMeLinks();
      const expectedCount = SOCIAL_LINKS.filter((link) => link.relMe).length;
      expect(relMeLinks.length).toBe(expectedCount);
    });

    it("should have correct structure for each rel=me link", () => {
      const relMeLinks = getRelMeLinks();
      relMeLinks.forEach((link) => {
        expect(link.href).toMatch(/^https?:\/\/.+/);
        expect(link.rel).toMatch(/^me( atproto)?$/);
        expect(link.platform).toBeTruthy();
      });
    });

    it("should use atprotoUrl for bluesky if available", () => {
      const relMeLinks = getRelMeLinks();
      const blueskyLink = relMeLinks.find((link) => link.platform === "bluesky");

      if (blueskyLink) {
        const originalBluesky = SOCIAL_LINKS.find((link) => link.platform === "bluesky");
        if (originalBluesky && "atprotoUrl" in originalBluesky) {
          expect(blueskyLink.href).toBe(originalBluesky.atprotoUrl);
          expect(blueskyLink.rel).toBe("me atproto");
        }
      }
    });

    it("should have at least 3 rel=me links", () => {
      const relMeLinks = getRelMeLinks();
      expect(relMeLinks.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("getPersonSchema()", () => {
    it("should return valid Schema.org Person object", () => {
      const schema = getPersonSchema();

      expect(schema["@type"]).toBe("Person");
      expect(schema.name).toBe(SITE.name);
      expect(schema.url).toBe(SITE.url);
    });

    it("should be suitable for embedding in other schemas", () => {
      const schema = getPersonSchema();

      // Should have required Schema.org Person properties
      expect(schema).toHaveProperty("@type");
      expect(schema).toHaveProperty("name");
      expect(schema).toHaveProperty("url");
    });
  });

  describe("Type safety", () => {
    it("should have correct TypeScript types", () => {
      // This is a compile-time test - if it compiles, types are correct
      const link: (typeof SOCIAL_LINKS)[number] = SOCIAL_LINKS[0];
      expect(link.platform).toBeTruthy();

      const relMeLink = getRelMeLinks()[0];
      expect(relMeLink.platform).toBeTruthy();
    });
  });
});
