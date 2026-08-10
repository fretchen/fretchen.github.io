const ANALYTICS_URL =
  (import.meta.env.PUBLIC_ENV__ANALYTICS_URL as string | undefined) ??
  "https://analyticsserviceebp8thpt-hit.functions.fnc.fr-par.scw.cloud";

export function trackHit(path: string) {
  navigator.sendBeacon(`${ANALYTICS_URL}/hit`, JSON.stringify({ site: "fretchen.eu", path }));
}
