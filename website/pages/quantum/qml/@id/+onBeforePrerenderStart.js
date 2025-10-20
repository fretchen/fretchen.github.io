export { onBeforePrerenderStart };

import { loadBlogs } from "../../../../utils/blogLoader.js";

async function onBeforePrerenderStart() {
  // Load quantum QML lectures (will be cached, sorted by order)
  const blogs = await loadBlogs("quantum/qml", "order");

  const urls = blogs.map((blog, index) => {
    return `/quantum/qml/${index}`;
  });
  return urls;
}
