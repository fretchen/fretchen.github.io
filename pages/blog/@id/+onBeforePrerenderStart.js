export { onBeforePrerenderStart };

import blogs from "../../../blog/blogs.json";

async function onBeforePrerenderStart() {
  const blogURLs = blogs.map((blog, index) => {
    const blogURL = `/blog/${index}`;
    return blogURL;
  });
  console.log("blogURLs");
  console.log(blogURLs);
  return blogURLs;
}
