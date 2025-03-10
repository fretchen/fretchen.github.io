import blogs from "../../../blog/blogs.json";

import type { PageContext } from "vike/types";

export function title(pageContext: PageContext) {
  const id = Number(pageContext.routeParams.id);
  const blog = blogs[id];
  return blog.title;
}
