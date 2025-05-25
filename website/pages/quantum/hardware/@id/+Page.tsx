import * as React from "react";
import blogs from "../../../../quantum/hardware/blogs.json";
import { usePageContext } from "vike-react/usePageContext";
import { Post } from "../../../../components/Post";
import { pageContainer } from "../../../../layouts/styles";

const App: React.FC = function () {
  const pageContext = usePageContext();
  const id = Number(pageContext.routeParams.id);

  if (isNaN(id)) {
    throw new Error("Invalid blog post ID");
  }

  // Aktuelle, vorherige und nächste Blogeinträge
  const blog = blogs[id];
  const prevBlog = id > 0 ? blogs[id - 1] : null;
  const nextBlog = id < blogs.length - 1 ? blogs[id + 1] : null;

  // Navigations-Objekte für Post-Komponente
  const prevPost = prevBlog ? { title: prevBlog.title, id: id - 1 } : null;
  const nextPost = nextBlog ? { title: nextBlog.title, id: id + 1 } : null;

  return (
    <div className={pageContainer}>
      <Post
        title={blog.title}
        content={blog.content}
        prevPost={prevPost}
        nextPost={nextPost}
        basePath="/quantum/hardware" // Korrekter Pfad für diese Blog-Kategorie
      />
    </div>
  );
};

export default App;
