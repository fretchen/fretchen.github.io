import type { PageContext } from "vike/types";

export async function onPageTransitionStart(_pageContext: PageContext) {
  document.querySelector("body")?.classList.add("page-is-transitioning");
}
