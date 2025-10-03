import { loadBlogs } from "../../../utils/blogLoader";
import type { PageContextServer } from "vike/types";

export async function data(pageContext: PageContextServer) {
  const blogs = await loadBlogs("blog");
  const id = Number(pageContext.routeParams.id);
  const blog = blogs[id];

  if (!blog) {
    throw new Error(`Blog post ${id} not found`);
  }

  return {
    blog,
    id,
  };
}
