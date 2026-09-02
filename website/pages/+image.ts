/**
 * Default social card image (`og:image` + `twitter:card`, rendered by vike-react).
 *
 * The x402 and quantum pages previously had no og:image at all. `+image` is
 * non-cumulative, so the per-page `+image.ts` files (blog posts, imagegen, assistent,
 * agent-onboarding) still override this.
 */
export function image() {
  return "https://www.fretchen.eu/assets/static/image_3_1fc7cfc7b9e9.6dd4a243.jpg";
}
