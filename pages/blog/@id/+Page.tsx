import * as React from "react";

import blogs from "../../../blog/blogs.json";
import { usePageContext } from "vike-react/usePageContext";
import { Post } from "../../../components/Post";
import { Link } from "../../../components/Link";

const App: React.FC = function () {
  const pageContext = usePageContext();
  const id = Number(pageContext.routeParams.id);
  const prevBlog = id > 0 ? blogs[id - 1] : null;
  const nextBlog = id < blogs.length - 1 ? blogs[id + 1] : null;

  if (isNaN(id)) {
    throw new Error("Invalid blog post ID");
  }
  // select the t`th blog post from blogs.json
  const blog = blogs[id];

  return (
    <div>
      <Post title={blog.title} content={blog.content} publishing_date={blog.publishing_date} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        {prevBlog && <Link href={`/blog/${id - 1}`}>Previous post: {prevBlog.title}</Link>}
        {nextBlog && <Link href={`/blog/${id + 1}`}>Next post: {nextBlog.title}</Link>}
      </div>
    </div>
  );
};

export default App;
