import { describe, expect, it } from "vitest";
import { normalizePageUrl } from "@utils/urlUtils";

describe("normalizePageUrl", () => {
  it("strips UTM params — mastodon and bluesky links collapse to the same key", () => {
    const mastodon = "https://www.fretchen.eu/blog/1?utm_source=mastodon&utm_campaign=growth-agent";
    const bluesky = "https://www.fretchen.eu/blog/1?utm_source=bluesky&utm_campaign=growth-agent";
    expect(normalizePageUrl(mastodon)).toBe(normalizePageUrl(bluesky));
    expect(normalizePageUrl(mastodon)).toBe("https://www.fretchen.eu/blog/1");
  });

  it("strips trailing slash from non-root paths", () => {
    expect(normalizePageUrl("https://www.fretchen.eu/blog/1/")).toBe("https://www.fretchen.eu/blog/1");
  });

  it("preserves the root slash", () => {
    expect(normalizePageUrl("https://www.fretchen.eu/")).toBe("https://www.fretchen.eu/");
  });

  it("strips both UTM params and trailing slash together", () => {
    const url = "https://www.fretchen.eu/blog/1/?utm_source=mastodon";
    expect(normalizePageUrl(url)).toBe("https://www.fretchen.eu/blog/1");
  });

  it("returns the raw string unchanged for unparseable input", () => {
    expect(normalizePageUrl("(no link)")).toBe("(no link)");
  });
});
