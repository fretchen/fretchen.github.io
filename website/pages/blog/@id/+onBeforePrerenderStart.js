export { onBeforePrerenderStart };

import { loadBlogs } from "../../../utils/blogLoader.js";

async function onBeforePrerenderStart() {
  // Load blogs using the same loader (will be cached)
  const blogs = await loadBlogs("blog", "publishing_date");
  
  const blogURLs = blogs.map((blog, index) => {
    const blogURL = `/blog/${index}`;
    return blogURL;
  });
  return blogURLs;
}
