export { onBeforePrerenderStart };

import blogs from "../../../amo/blogs.json";

async function onBeforePrerenderStart() {
  const blogURLs = blogs.map((blog, index) => {
    const blogURL = `/amo/${index}`;
    return blogURL;
  });
  console.log("blogURLs");
  console.log(blogURLs);
  return blogURLs;
}