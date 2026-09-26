/**
 * Default social card image (`og:image` + `twitter:card`, rendered by vike-react).
 *
 * The x402 and quantum pages previously had no og:image at all. `+image` is
 * non-cumulative, so the per-page `+image.ts` files (blog posts, imagegen, assistent,
 * agent-onboarding) still override this — the ones whose value can be empty
 * (blog / lecture posts without an NFT image) fall back to `DEFAULT_SOCIAL_IMAGE`.
 *
 * The asset is a static file in `public/`, not a Vite import — og:image/twitter:card
 * don't support SVG (Facebook/Twitter/LinkedIn won't rasterize it), so this points at
 * the PNG export; `SITE.photo` in `utils/siteData.ts` uses the SVG version instead,
 * since that one is only ever read by machine parsers, never rendered in a browser.
 */
import { SITE_CONFIG } from "../utils/siteConfig";

/** Absolute URL of the default social card; also the fallback for pages whose own +image can be empty. */
export const DEFAULT_SOCIAL_IMAGE = `${SITE_CONFIG.url}/fretchen.png`;

export function image() {
  return DEFAULT_SOCIAL_IMAGE;
}
