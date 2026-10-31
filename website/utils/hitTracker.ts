import { ANALYTICS_URL } from "./analyticsApi";

/**
 * Deliberately not `scroll`: headless crawlers routinely auto-scroll to trigger
 * lazy loading. `wheel` is different — a programmatic `scrollBy` fires `scroll`
 * but not `wheel`, so a physical wheel turn is evidence of a device in someone's
 * hand, while a desktop reader who scrolls and reads without ever moving the
 * pointer is still counted (the October 2026 Umami cross-check showed the
 * pointer-only gate dropping about half of real readers). Touch devices are
 * covered too — a touch-scroll fires `touchstart`/`pointerdown`.
 */
const INTERACTION_EVENTS = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"] as const;

let pending: AbortController | undefined;

/**
 * Counts a view only once the visitor does something, so a renderer that loads
 * and leaves is never counted however long it waits. This replaced a 3s dwell
 * timer, which a crawler simply out-waited from 2026-09-30. Note the trade: it
 * is *looser* than that timer for a fast human (a click at 200ms now counts)
 * and tighter for a renderer, because it measures "a person was here" rather
 * than "a person stayed".
 *
 * Navigating away cancels the pending hit. No `pagehide` flush — that would
 * hand the uncounted hits straight back.
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
  pending?.abort();
  const controller = new AbortController();
  pending = controller;

  const send = () => {
    controller.abort(); // one beacon per page: drops the sibling listeners
    navigator.sendBeacon(`${ANALYTICS_URL}/hit`, JSON.stringify({ site: "fretchen.eu", path, landing: isLanding }));
  };

  for (const type of INTERACTION_EVENTS) {
    addEventListener(type, send, { once: true, passive: true, signal: controller.signal });
  }
}
