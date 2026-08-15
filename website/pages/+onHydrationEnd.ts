import type { PageContextClient } from "vike/types";
import { trackHit } from "../utils/hitTracker";

export function onHydrationEnd(pageContext: PageContextClient) {
  trackHit(pageContext.urlPathname, true);
}
