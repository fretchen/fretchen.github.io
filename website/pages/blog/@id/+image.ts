import blogs from "../../../blog/blogs.json";

import type { PageContext } from "vike/types";

export function image(pageContext: PageContext) {
  const id = Number(pageContext.routeParams.id);
  const blog = blogs[id];
  console.log("Blog page title:", blog.nftMetadata?.imageUrl);
  return blog.nftMetadata?.imageUrl;
}