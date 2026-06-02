import type { PageContext } from "vike/types";
export function onPageTransitionStart(_pageContext: PageContext) {
  document.querySelector("body")?.classList.add("page-is-transitioning");
}
