import * as React from "react";
import blogs from "../../../blog/blogs.json";
import { usePageContext } from "vike-react/usePageContext";
import { Post } from "../../../components/Post";
import { pageContainer } from "../../../layouts/styles";

const App: React.FC = function () {
  const pageContext = usePageContext();
  const id = Number(pageContext.routeParams.id);

  if (isNaN(id)) {
    throw new Error("Invalid blog post ID");
  }

  // Blog-Einträge und Navigation
  const blog = blogs[id];
  const prevBlog = id > 0 ? blogs[id - 1] : null;
  const nextBlog = id < blogs.length - 1 ? blogs[id + 1] : null;

  // Navigations-Objekte für erweiterte Post-Komponente
  const prevPost = prevBlog ? { title: prevBlog.title, id: id - 1 } : null;
  const nextPost = nextBlog ? { title: nextBlog.title, id: id + 1 } : null;

  console.log("Blog page rendering blog:", blog);
  console.log("Blog tokenID:", blog.tokenID);

  return (
    <div className={pageContainer}>
      <Post
        title={blog.title}
        content={blog.content}
        publishing_date={blog.publishing_date}
        tokenID={blog.tokenID}
        type={blog.type}
        componentPath={blog.componentPath}
        prevPost={prevPost}
        nextPost={nextPost}
        basePath="/blog"
      />
    </div>
  );
};

export default App;
