import { loadBlogs } from "../../../utils/blogLoader";

export const data = async () => {
  // Load all quantum QML lectures (will be cached during build, sorted by order)
  const blogs = await loadBlogs("quantum/qml", "order");

  return {
    blogs,
  };
};
