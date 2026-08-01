/**
 * Core site configuration constants
 *
 * Separated from siteData.ts to allow usage in build scripts
 * that can't process image imports (e.g., tsx ./utils/generateSitemap.ts)
 *
 * @see siteData.ts for full site configuration including images
 */

export const SITE_CONFIG = {
  name: "fretchen",
  url: "https://www.fretchen.eu",
  description:
    "Notes, essays and things I built while working topics out — quantum physics, game theory and economics, and building on the web.",
  tagline: "Notes, essays and things I built while working topics out.",
} as const;
