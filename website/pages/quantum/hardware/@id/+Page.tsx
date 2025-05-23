import * as React from "react";
import blogs from "../../../../quantum/hardware/blogs.json";
import { usePageContext } from "vike-react/usePageContext";
import { Post } from "../../../../components/Post";
import { css } from "../../../../styled-system/css";

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
    <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
      <Post
        title={blog.title}
        content={blog.content}
        publishing_date={blog.publishing_date}
        prevPost={prevPost}
        nextPost={nextPost}
        basePath="/quantum/basics" // Korrekter Pfad für diese Blog-Kategorie
      />
    </div>
  );
};

export default App;
