export { onBeforePrerenderStart };

import { loadBlogs } from "../../../../utils/blogLoader.js";

async function onBeforePrerenderStart() {
  // Load quantum hardware lectures (will be cached, sorted by order)
  const blogs = await loadBlogs("quantum/hardware", "order");

  const urls = blogs.map((blog, index) => {
    return `/quantum/hardware/${index}`;
  });
  return urls;
}
