import type { PageContext } from "vike/types";
export function onPageTransitionEnd(_pageContext: PageContext) {
  document.querySelector("body")?.classList.remove("page-is-transitioning");
}
