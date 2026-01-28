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
  description: "Physicist, researcher, and developer sharing thoughts on quantum physics, AI, and technology.",
  tagline: "Exploring Web3, Quantum Mechanics & Decentralized Technologies",
} as const;
