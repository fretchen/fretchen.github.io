/**
 * Which part of the site a route belongs to, and therefore which accent colour it wears.
 *
 * Two page territories:
 *
 *   voice   — brand blue   writing and navigation: home, blog, quantum notes, articles
 *   explore — purple       the lab: the experiments, and every tool reachable from it
 *
 * Quantum is `voice`, not `explore`: it is writing, the same as the blog. And the lab's
 * children (`/imagegen`, `/x402`, …) carry the lab's hue — they *are* its contents, so
 * following a card from `/lab` must not change colour.
 *
 * Orange is deliberately absent here. It means value exchange — collect, support, tip, pay
 * — which is a property of *actions*, not of pages, so it lives on buttons only. Using it
 * as a page mark is what previously split the lab in two.
 *
 * The accent is deliberately small: a short rule under a section's title, and the active
 * nav item. Article pages inherit nothing, so a blog post is never tinted — you meet the
 * colour on entering a territory, not while reading.
 *
 * This is the single source of the route -> hue mapping. Adding a section means adding one
 * prefix here, not touching the pages.
 */

export type Territory = "voice" | "explore";

/** Longest-prefix wins, so a nested route resolves before its parent. */
const PREFIXES: ReadonlyArray<readonly [string, Territory]> = [
  ["/lab", "explore"],
  ["/imagegen", "explore"],
  ["/x402", "explore"],
  ["/assistent", "explore"],
  ["/agent-onboarding", "explore"],
];

export function territoryFor(pathname: string): Territory {
  // Locale-prefixed routes (/de/lab) must resolve to the same territory.
  const path = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const match = PREFIXES.filter(([prefix]) => path === prefix || path.startsWith(prefix + "/")).sort(
    (a, b) => b[0].length - a[0].length,
  )[0];
  return match ? match[1] : "voice";
}
