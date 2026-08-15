import type { PageContext } from "vike/types";
import { trackHit } from "../utils/hitTracker";

export function onPageTransitionEnd(pageContext: PageContext) {
  document.querySelector("body")?.classList.remove("page-is-transitioning");
  trackHit(pageContext.urlPathname, false);
}
