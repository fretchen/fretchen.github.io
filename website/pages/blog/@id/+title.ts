import type { PageContext } from "vike/types";

export function title(pageContext: PageContext) {
  // Use blog data from pageContext.data (loaded via +data.ts)
  const blog = pageContext.data.blog;
  return blog?.title || "Blog Post";
}
