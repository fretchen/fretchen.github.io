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

/**
 * Default social card (`og:image` + `twitter:card`), served by `pages/+image.ts` and the fallback
 * for per-page `+image.ts` files whose own image can be empty. A PNG, because social platforms
 * do not rasterize SVG. Lives here, not in `+image.ts`: a Vike `+` file may export only its setting.
 */
export const DEFAULT_SOCIAL_IMAGE = `${SITE_CONFIG.url}/fretchen.png`;
