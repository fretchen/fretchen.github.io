import { describe, expect, it, vi, beforeEach } from "vitest";
import { trackHit } from "@utils/hitTracker";

/** What a real visitor does; `scroll` is deliberately excluded (see hitTracker.ts). */
const interact = (type = "pointerdown") => window.dispatchEvent(new Event(type));

const lastBody = () => JSON.parse(vi.mocked(navigator.sendBeacon).mock.calls[0][1] as string);

describe("trackHit", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn() });
  });

  it("sends nothing until the visitor interacts", () => {
    trackHit("/blog/foo", true);

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("sends a beacon to /hit with the site and path on first interaction", () => {
    trackHit("/blog/foo", true);
    interact();

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    const [url, body] = vi.mocked(navigator.sendBeacon).mock.calls[0];
    expect(url).toMatch(/\/hit$/);
    expect(JSON.parse(body as string)).toEqual({ site: "fretchen.eu", path: "/blog/foo", landing: true });
  });

  it.each(["pointerdown", "pointermove", "keydown", "touchstart"])("counts a %s as an interaction", (type) => {
    trackHit("/blog/foo", true);
    interact(type);

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  });

  it("does not count a scroll — crawlers auto-scroll to trigger lazy loading", () => {
    trackHit("/blog/foo", true);
    interact("scroll");

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("sends only one beacon however much the visitor interacts", () => {
    trackHit("/blog/foo", true);
    interact("pointermove");
    interact("pointermove");
    interact("keydown");
    interact("pointerdown");

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
  });

  it("forwards isLanding=false for an in-app navigation", () => {
    trackHit("/blog/foo", false);
    interact();

    expect(lastBody()).toMatchObject({ landing: false });
  });

  it("cancels the pending hit when the visitor navigates away before interacting", () => {
    trackHit("/blog/first", true);
    trackHit("/blog/second", false);
    interact();

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    expect(lastBody()).toMatchObject({ path: "/blog/second" });
  });

  it("counts each page separately when the visitor interacts on both", () => {
    trackHit("/blog/first", true);
    interact();
    trackHit("/blog/second", false);
    interact();

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(2);
    const paths = vi
      .mocked(navigator.sendBeacon)
      .mock.calls.map(([, body]) => JSON.parse(body as string).path);
    expect(paths).toEqual(["/blog/first", "/blog/second"]);
  });

  it("skips the beacon entirely when navigator.webdriver is set", () => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(), webdriver: true });

    trackHit("/blog/foo", true);
    interact();

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });
});
