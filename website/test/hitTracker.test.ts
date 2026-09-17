import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { trackHit } from "@utils/hitTracker";

const DWELL_MS = 3000;

describe("trackHit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", { sendBeacon: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends a beacon to /hit with the site and path", () => {
    trackHit("/blog/foo", true);
    vi.advanceTimersByTime(DWELL_MS);

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    const [url, body] = vi.mocked(navigator.sendBeacon).mock.calls[0];
    expect(url).toMatch(/\/hit$/);
    expect(JSON.parse(body as string)).toEqual({ site: "fretchen.eu", path: "/blog/foo", landing: true });
  });

  it("forwards isLanding=false for an in-app navigation", () => {
    trackHit("/blog/foo", false);
    vi.advanceTimersByTime(DWELL_MS);

    const [, body] = vi.mocked(navigator.sendBeacon).mock.calls[0];
    expect(JSON.parse(body as string)).toMatchObject({ landing: false });
  });

  it("skips the beacon entirely when navigator.webdriver is set", () => {
    vi.stubGlobal("navigator", { sendBeacon: vi.fn(), webdriver: true });

    trackHit("/blog/foo", true);
    vi.advanceTimersByTime(DWELL_MS);

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("sends nothing before the dwell time elapses", () => {
    trackHit("/blog/foo", true);
    vi.advanceTimersByTime(DWELL_MS - 1);

    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("cancels the pending hit when the visitor navigates away first", () => {
    trackHit("/blog/first", true);
    vi.advanceTimersByTime(1000);
    trackHit("/blog/second", false);
    vi.advanceTimersByTime(DWELL_MS);

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    const [, body] = vi.mocked(navigator.sendBeacon).mock.calls[0];
    expect(JSON.parse(body as string)).toMatchObject({ path: "/blog/second" });
  });

  it("counts a page that outlasts the dwell time after an earlier bounce", () => {
    trackHit("/blog/bounced", true);
    vi.advanceTimersByTime(500);
    trackHit("/blog/read", false);
    vi.advanceTimersByTime(DWELL_MS * 2);

    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    expect(JSON.parse(vi.mocked(navigator.sendBeacon).mock.calls[0][1] as string)).toMatchObject({
      path: "/blog/read",
    });
  });
});
