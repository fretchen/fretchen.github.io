/**
 * Default social card image (`og:image` + `twitter:card`, rendered by vike-react).
 *
 * `+image` is non-cumulative, so the per-page `+image.ts` files (blog posts, imagegen, assistent,
 * agent-onboarding) override this; the ones whose value can be empty (blog / lecture posts
 * without an NFT image) fall back to `DEFAULT_SOCIAL_IMAGE` themselves.
 */
import { DEFAULT_SOCIAL_IMAGE } from "../utils/siteConfig";

export function image() {
  return DEFAULT_SOCIAL_IMAGE;
}
