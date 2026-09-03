/**
 * Default social card image (`og:image` + `twitter:card`, rendered by vike-react).
 *
 * The x402 and quantum pages previously had no og:image at all. `+image` is
 * non-cumulative, so the per-page `+image.ts` files (blog posts, imagegen, assistent,
 * agent-onboarding) still override this — the ones whose value can be empty
 * (blog / lecture posts without an NFT image) fall back to `DEFAULT_SOCIAL_IMAGE`.
 *
 * The asset is imported, not hardcoded, so its Vite content hash stays correct across
 * builds; `pages/+Head.tsx` imports the same file for the favicon.
 */
import socialCard from "./image_3_1fc7cfc7b9e9.jpg";
import { SITE_CONFIG } from "../utils/siteConfig";

/** Absolute URL of the default social card; also the fallback for pages whose own +image can be empty. */
export const DEFAULT_SOCIAL_IMAGE = `${SITE_CONFIG.url}${socialCard}`;

export function image() {
  return DEFAULT_SOCIAL_IMAGE;
}
