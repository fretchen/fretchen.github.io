export { onBeforePrerenderStart };

import { loadBlogs } from "../../../../utils/blogLoader.js";

async function onBeforePrerenderStart() {
  // Load quantum basics lectures (will be cached, sorted by order)
  const blogs = await loadBlogs("quantum/basics", "order");

  const urls = blogs.map((blog, index) => {
    return `/quantum/basics/${index}`;
  });
  return urls;
}
