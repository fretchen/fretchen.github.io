import * as React from "react";
import { useBlogData } from "../../../../hooks/useBlogData";
import { usePageContext } from "vike-react/usePageContext";
import { Post } from "../../../../components/Post";
import { pageContainer } from "../../../../layouts/styles";

const App: React.FC = function () {
  const pageContext = usePageContext();
  const id = Number(pageContext.routeParams.id);
  const { blogs, loading, error } = useBlogData("quantum/basics", "order");

  if (isNaN(id)) {
    throw new Error("Invalid blog post ID");
  }

  if (loading) {
    return (
      <div className={pageContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={pageContainer}>
        <p>Error loading blog post: {error}</p>
      </div>
    );
  }

  if (!blogs[id]) {
    throw new Error(`Blog post with ID ${id} not found`);
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
        type={blog.type}
        componentPath={blog.componentPath}
        prevPost={prevPost}
        nextPost={nextPost}
        basePath="/quantum/basics" // Korrekter Pfad für diese Blog-Kategorie
      />
    </div>
  );
};

export default App;
