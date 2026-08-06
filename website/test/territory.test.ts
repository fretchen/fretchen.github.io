import { describe, it, expect } from "vitest";
import { territoryFor } from "../utils/territory";

/**
 * `territoryFor` decides which accent colour every page wears, from its route alone.
 *
 * Two behaviours are easy to break and invisible until you look at the rendered page:
 * the locale prefix has to be stripped (so `/de/lab` is still the lab), and the longest
 * matching prefix has to win (so a nested route never falls back to `voice`).
 */
describe("territoryFor", () => {
  it("defaults to voice — writing is the site's baseline, not a special case", () => {
    expect(territoryFor("/")).toBe("voice");
    expect(territoryFor("/blog")).toBe("voice");
    expect(territoryFor("/blog/25")).toBe("voice");
  });

  it("keeps quantum in voice: lecture notes are writing, not lab experiments", () => {
    expect(territoryFor("/quantum")).toBe("voice");
    expect(territoryFor("/quantum/amo")).toBe("voice");
    expect(territoryFor("/quantum/qml/3")).toBe("voice");
  });

  it("gives the lab and everything reachable from it one hue", () => {
    // The point of the map: following a card from /lab must not change colour.
    for (const path of ["/lab", "/imagegen", "/x402", "/assistent", "/agent-onboarding"]) {
      expect(territoryFor(path), path).toBe("explore");
    }
  });

  it("strips a locale prefix", () => {
    expect(territoryFor("/de/lab")).toBe("explore");
    expect(territoryFor("/de/imagegen")).toBe("explore");
    expect(territoryFor("/de/blog/25")).toBe("voice");
    expect(territoryFor("/de")).toBe("voice");
  });

  it("matches whole segments only, never a bare prefix", () => {
    // `/labour` starts with "/lab" but is a different route.
    expect(territoryFor("/labour")).toBe("voice");
    expect(territoryFor("/x402-facilitator")).toBe("voice");
  });

  it("resolves nested routes to their section", () => {
    expect(territoryFor("/lab/anything/deeper")).toBe("explore");
    expect(territoryFor("/x402/quickstart")).toBe("explore");
  });

  it("falls back to voice for unknown routes rather than throwing", () => {
    expect(territoryFor("/does-not-exist")).toBe("voice");
    expect(territoryFor("")).toBe("voice");
  });
});
