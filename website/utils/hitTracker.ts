import { ANALYTICS_URL } from "./analyticsApi";

/**
 * `navigator.webdriver` is set by unmodified automation frameworks
 * (Selenium/Playwright/Puppeteer defaults) — a free, zero-data-sent signal to
 * skip the beacon entirely. It won't catch a crawler that deliberately hides
 * this property, but it costs nothing to check and sends nothing new either way.
 *
 * `isLanding` distinguishes a fresh page load (`+onHydrationEnd.ts`) from an
 * in-app navigation (`+onPageTransitionEnd.ts`) — not PII, since it's a fact
 * about this one isolated hit, never linked to any other hit or to a person.
 * "Landings ÷ hits" is a close proxy for how many pages a visit covers, the
 * signal that separated real browsing from crawler sweeps in
 * analytics/notebooks/05_traffic_bursts.ipynb.
 */
export function trackHit(path: string, isLanding: boolean) {
  if (navigator.webdriver) {
    return;
  }
  navigator.sendBeacon(
    `${ANALYTICS_URL}/hit`,
    JSON.stringify({ site: "fretchen.eu", path, landing: isLanding }),
  );
}
