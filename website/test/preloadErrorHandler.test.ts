import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { installPreloadErrorHandler } from "../utils/preloadErrorHandler";

/**
 * Tests for the stale-chunk recovery handler.
 * Vite dispatches "vite:preloadError" on window when a dynamic import fails
 * (e.g. content-hashed chunk URLs gone after a redeploy); the handler reloads
 * the page once per pathname to pick up fresh chunk URLs.
 */
describe("installPreloadErrorHandler", () => {
  let uninstall: (() => void) | null = null;
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, pathname: "/blog/1/", reload: reloadSpy },
    });
  });

  afterEach(() => {
    uninstall?.();
    uninstall = null;
    sessionStorage.clear();
  });

  it("reloads the page on the first vite:preloadError", () => {
    uninstall = installPreloadErrorHandler();

    window.dispatchEvent(new Event("vite:preloadError"));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("does not reload again for the same pathname (no reload loop)", () => {
    uninstall = installPreloadErrorHandler();

    window.dispatchEvent(new Event("vite:preloadError"));
    window.dispatchEvent(new Event("vite:preloadError"));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("reloads again on a different pathname", () => {
    uninstall = installPreloadErrorHandler();

    window.dispatchEvent(new Event("vite:preloadError"));
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    window.location.pathname = "/blog/2/";
    window.dispatchEvent(new Event("vite:preloadError"));
    expect(reloadSpy).toHaveBeenCalledTimes(2);
  });

  it("stops listening after uninstall", () => {
    const cleanup = installPreloadErrorHandler();
    cleanup();

    window.dispatchEvent(new Event("vite:preloadError"));

    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
