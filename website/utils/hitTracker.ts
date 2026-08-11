import { ANALYTICS_URL } from "./analyticsApi";

export function trackHit(path: string) {
  navigator.sendBeacon(`${ANALYTICS_URL}/hit`, JSON.stringify({ site: "fretchen.eu", path }));
}
