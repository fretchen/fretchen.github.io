import { loadBlogs } from "../../utils/blogLoader";

export const data = async () => {
  // Load all blogs once (will be cached during build)
  const blogs = await loadBlogs("blog", "publishing_date");

  return {
    blogs,
  };
};
