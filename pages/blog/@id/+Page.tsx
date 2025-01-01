import * as React from "react";

import { MuiMarkdown } from "mui-markdown";
import blogs from "../../../blog/blogs.json";
import { usePageContext } from "vike-react/usePageContext";
import { Post } from "../../../components/Post";

const App: React.FC = function () {
  const pageContext = usePageContext();
  const id = pageContext.routeParams.id;
  // select the t`th blog post from blogs.json
  const blog = blogs[id];

  return <Post title={blog.title} content={blog.content} />;
};

export default App;
