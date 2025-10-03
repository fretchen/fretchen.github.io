export { onBeforePrerenderStart };

import { loadBlogs } from "../../../utils/blogLoader.ts";

async function onBeforePrerenderStart() {
  const blogs = await loadBlogs("blog");
  const blogURLs = blogs.map((blog, index) => {
    const blogURL = `/blog/${index}`;
    return blogURL;
  });
  return blogURLs;
}
