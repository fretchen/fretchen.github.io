import * as React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { Post } from "../../../components/Post";
import { pageContainer } from "../../../layouts/styles";

const App: React.FC = function () {
  const pageContext = usePageContext();
  const id = Number(pageContext.routeParams.id);

  // Get pre-loaded data from +data.ts
  const { blog, prevBlog, nextBlog } = pageContext.data;

  // Navigations-Objekte für erweiterte Post-Komponente
  const prevPost = prevBlog ? { title: prevBlog.title, id: id - 1 } : null;
  const nextPost = nextBlog ? { title: nextBlog.title, id: id + 1 } : null;

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
        description={blog.description}
        category={blog.category}
        secondaryCategory={blog.secondaryCategory}
      />
    </div>
  );
};

export default App;
