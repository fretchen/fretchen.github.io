import { loadBlogs } from "../../../utils/blogLoader";

export const data = async () => {
  // Load all AMO lectures once (will be cached during build, sorted by order)
  const blogs = await loadBlogs("quantum/amo", "order");

  return {
    blogs,
  };
};
