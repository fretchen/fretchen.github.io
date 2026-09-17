import { ANALYTICS_URL } from "./analyticsApi";

const DWELL_MS = 3000;

let pending: ReturnType<typeof setTimeout> | undefined;

/**
 * An *engaged* view, not a raw pageview: a JS-executing crawler that loads,
 * snapshots and leaves never outlasts DWELL_MS, and its User-Agent is
 * unrecoverable by design (`analytics/hit.ts` discards it), so a blocklist was
 * not an option. Navigating away cancels the pending hit. No `pagehide` flush —
 * that would hand those hits straight back.
 *
 * `isLanding` separates a fresh load (`+onHydrationEnd.ts`) from an in-app
 * navigation (`+onPageTransitionEnd.ts`) — not PII, it describes this one hit
 * and is never linked to another. `navigator.webdriver` catches unmodified
 * automation frameworks for free.
 */
export function trackHit(path: string, isLanding: boolean) {
  if (navigator.webdriver) {
    return;
  }
  clearTimeout(pending);
  pending = setTimeout(() => {
    navigator.sendBeacon(`${ANALYTICS_URL}/hit`, JSON.stringify({ site: "fretchen.eu", path, landing: isLanding }));
  }, DWELL_MS);
}
