/**
 * Which part of the site a route belongs to, and therefore which accent colour it wears.
 *
 * The site has three identity hues, each with one job (see panda.config.ts):
 *
 *   voice   — brand blue    the default: home, writing, navigation
 *   explore — purple        the scientific half: quantum notes, lab, simulations
 *   value   — orange        the transactional half: minting, collecting, payments
 *
 * The accent is deliberately small — a short rule under a section's title and the active
 * nav indicator. Article pages inherit nothing, so a blog post is never tinted; you meet
 * the colour on entering a territory, not while reading.
 *
 * This is the single source of the route -> hue mapping. Adding a section means adding one
 * prefix here, not touching the pages.
 */

export type Territory = "voice" | "explore" | "value";

/** Longest-prefix wins, so `/quantum/amo` resolves before the bare `/quantum`. */
const PREFIXES: ReadonlyArray<readonly [string, Territory]> = [
  ["/quantum", "explore"],
  ["/lab", "explore"],
  ["/imagegen", "value"],
  ["/x402", "value"],
];

export function territoryFor(pathname: string): Territory {
  // Locale-prefixed routes (/de/quantum) must resolve to the same territory.
  const path = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const match = PREFIXES.filter(([prefix]) => path === prefix || path.startsWith(prefix + "/")).sort(
    (a, b) => b[0].length - a[0].length,
  )[0];
  return match ? match[1] : "voice";
}
