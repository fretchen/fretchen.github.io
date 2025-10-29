/**
 * Site-wide configuration for metadata, social links, and author information
 *
 * This central config ensures consistency across:
 * - Footer h-card (microformats2)
 * - HTML <head> rel="me" links (IndieWeb)
 * - Schema.org structured data (SEO)
 * - Social sharing metadata
 *
 * @see https://microformats.org/wiki/h-card
 * @see https://indieweb.org/rel-me
 * @see https://schema.org/Person
 */

// Import favicon for h-card u-photo
import favicon from "../pages/image_3_1fc7cfc7b9e9.jpg";

/**
 * Core site information
 */
export const SITE = {
  name: "fretchen",
  url: "https://www.fretchen.eu",
  description: "Physicist, researcher, and developer sharing thoughts on quantum physics, AI, and technology.",
  tagline: "Exploring Web3, Quantum Mechanics & Decentralized Technologies",
  photo: favicon, // u-photo for h-card (favicon/profile image)
} as const;

/**
 * Social media links with metadata for rendering and identity verification
 */
export const SOCIAL_LINKS = [
  {
    platform: "mastodon",
    url: "https://mastodon.social/@fretchen",
    handle: "@fretchen@mastodon.social",
    icon: "🐘",
    label: "Mastodon",
    relMe: true,
  },
  {
    platform: "github",
    url: "https://github.com/fretchen",
    handle: "fretchen",
    icon: "💻",
    label: "GitHub",
    relMe: true,
  },
  {
    platform: "bluesky",
    url: "https://bsky.app/profile/fretchen.eu",
    atprotoUrl: "https://fretchen.bsky.social",
    handle: "fretchen.eu",
    icon: "🦋",
    label: "Bluesky",
    relMe: true,
  },
] as const;

/**
 * Get all social links for rendering (e.g., in footer)
 */
export function getSocialLinks() {
  return SOCIAL_LINKS;
}

/**
 * Get rel="me" links for HTML <head> (IndieWeb identity verification)
 * Returns array of {href, rel, platform} objects
 */
export function getRelMeLinks() {
  return SOCIAL_LINKS.filter((link) => link.relMe).map((link) => ({
    href: (link as (typeof SOCIAL_LINKS)[2]).atprotoUrl || link.url,
    rel: (link as (typeof SOCIAL_LINKS)[2]).atprotoUrl ? "me atproto" : "me",
    platform: link.platform,
  }));
}

/**
 * Get Schema.org Person object for structured data
 * Used in multiple schema generators
 */
export function getPersonSchema() {
  return {
    "@type": "Person" as const,
    name: SITE.name,
    url: SITE.url,
  };
}

/**
 * Type definitions for TypeScript consumers
 */
export type SocialLink = (typeof SOCIAL_LINKS)[number];
export type RelMeLink = ReturnType<typeof getRelMeLinks>[number];
