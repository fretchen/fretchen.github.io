import * as React from "react";

import blogs from "../../../blog/blogs.json";
import { usePageContext } from "vike-react/usePageContext";
import { Post } from "../../../components/Post";

const App: React.FC = function () {
  const pageContext = usePageContext();
  const id = Number(pageContext.routeParams.id);

  if (isNaN(id)) {
    throw new Error("Invalid blog post ID");
  }
  // select the t`th blog post from blogs.json
  const blog = blogs[id];

  return <Post title={blog.title} content={blog.content} publishing_date={blog.publishing_date} />;
};

export default App;
