import type { PageContextServer } from "vike/types";
import { loadBlogs } from "../../../../utils/blogLoader";

export const data = async (pageContext: PageContextServer) => {
  const id = Number(pageContext.routeParams.id);

  if (isNaN(id)) {
    throw new Error("Invalid blog post ID");
  }

  // Load all quantum QML lectures (will be cached during build, sorted by order)
  const blogs = await loadBlogs("quantum/qml", "order");

  if (!blogs[id]) {
    throw new Error(`Quantum QML lecture with ID ${id} not found`);
  }

  // Return only the data needed for this specific page
  return {
    blog: blogs[id],
    prevBlog: id > 0 ? blogs[id - 1] : null,
    nextBlog: id < blogs.length - 1 ? blogs[id + 1] : null,
  };
};
