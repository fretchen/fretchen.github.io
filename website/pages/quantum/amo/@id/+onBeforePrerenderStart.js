export { onBeforePrerenderStart };

import { loadBlogs } from "../../../../utils/blogLoader.js";

async function onBeforePrerenderStart() {
  // Load AMO blogs using the blogLoader (will be cached, sorted by order)
  const blogs = await loadBlogs("quantum/amo", "order");

  const amoURLs = blogs.map((blog, index) => {
    const amoURL = `/quantum/amo/${index}`;
    return amoURL;
  });
  return amoURLs;
}
