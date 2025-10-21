import type { PageContextServer } from "vike/types";
import { loadBlogs } from "../../utils/blogLoader";

export async function data(_pageContext: PageContextServer) {
  // Load latest blog posts
  const blogs = await loadBlogs("blog", "publishing_date");

  return {
    blogs,
  };
}
