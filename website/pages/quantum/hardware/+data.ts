import { loadBlogs } from "../../../utils/blogLoader";

export const data = async () => {
  // Load all quantum hardware lectures (will be cached during build, sorted by order)
  const blogs = await loadBlogs("quantum/hardware", "order");

  return {
    blogs,
  };
};
