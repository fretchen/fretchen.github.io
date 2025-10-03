import type { PageContextServer } from "vike/types";
import { loadBlogs } from "../../../utils/blogLoader";

export const data = async (pageContext: PageContextServer) => {
  const id = Number(pageContext.routeParams.id);

  if (isNaN(id)) {
    throw new Error("Invalid blog post ID");
  }

  // Load all blogs once (will be cached during build)
  const blogs = await loadBlogs("blog", "publishing_date");

  if (!blogs[id]) {
    throw new Error(`Blog post with ID ${id} not found`);
  }

  // Return only the data needed for this specific page
  return {
    blog: blogs[id],
    prevBlog: id > 0 ? blogs[id - 1] : null,
    nextBlog: id < blogs.length - 1 ? blogs[id + 1] : null,
  };
};
