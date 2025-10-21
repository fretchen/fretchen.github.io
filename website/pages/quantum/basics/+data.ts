import { loadBlogs } from "../../../utils/blogLoader";

export const data = async () => {
  // Load all quantum basics lectures (will be cached during build, sorted by order)
  const blogs = await loadBlogs("quantum/basics", "order");

  return {
    blogs,
  };
};
