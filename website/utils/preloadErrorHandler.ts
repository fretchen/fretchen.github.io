/**
 * Recovers from stale-chunk failures after a redeploy.
 *
 * This is a prerendered static site with content-hashed chunk filenames; a tab
 * opened before a redeploy that then client-navigates to a post requests old
 * chunk URLs that no longer exist. Vite dispatches `vite:preloadError` on
 * window when a dynamic import fails — reloading picks up the new HTML with
 * fresh chunk URLs.
 *
 * A sessionStorage flag keyed by pathname limits this to one reload per page,
 * so a genuinely broken server can't cause a reload loop.
 */

const RELOAD_FLAG_PREFIX = "chunk-reload:";

export function installPreloadErrorHandler(): () => void {
  const handler = (event: Event) => {
    const flag = `${RELOAD_FLAG_PREFIX}${window.location.pathname}`;

    if (sessionStorage.getItem(flag)) {
      return;
    }

    sessionStorage.setItem(flag, "1");
    event.preventDefault();
    window.location.reload();
  };

  window.addEventListener("vite:preloadError", handler);
  return () => window.removeEventListener("vite:preloadError", handler);
}
