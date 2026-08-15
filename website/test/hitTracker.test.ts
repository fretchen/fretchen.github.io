import { describe, expect, it, vi, beforeEach } from "vitest";
import { trackHit } from "@utils/hitTracker";

describe("trackHit", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn() });
  });

  it("sends a beacon to /hit with the site and path", () => {
    trackHit("/blog/foo");

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    const [url, body] = vi.mocked(navigator.sendBeacon).mock.calls[0];
    expect(url).toMatch(/\/hit$/);
    expect(JSON.parse(body as string)).toEqual({ site: "fretchen.eu", path: "/blog/foo" });
  });

  it("skips the beacon entirely when navigator.webdriver is set", () => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(), webdriver: true });

    trackHit("/blog/foo");

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });
});
