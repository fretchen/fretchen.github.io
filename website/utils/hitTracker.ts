import { ANALYTICS_URL } from "./analyticsApi";

/**
 * `navigator.webdriver` is set by unmodified automation frameworks
 * (Selenium/Playwright/Puppeteer defaults) — a free, zero-data-sent signal to
 * skip the beacon entirely. It won't catch a crawler that deliberately hides
 * this property, but it costs nothing to check and sends nothing new either way.
 */
export function trackHit(path: string) {
  if (navigator.webdriver) {
    return;
  }
  navigator.sendBeacon(`${ANALYTICS_URL}/hit`, JSON.stringify({ site: "fretchen.eu", path }));
}
