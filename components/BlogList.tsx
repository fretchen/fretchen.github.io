import * as React from "react";

import blogs from "../blog/blogs.json";
import { Link } from "./Link";

const BlogList: React.FC = function () {
  // invert the presented order of the blogs
  const invertedBlogs = blogs.reverse();
  return (
    <div className="BlogList">
      {invertedBlogs.map((blog, index) => (
        <div key={blogs.length - 1 - index} style={{ marginBottom: "20px" }}>
          {blog.publishing_date && <p style={{ marginBottom: "5px" }}>{blog.publishing_date}</p>}
          <Link href={`/blog/${blogs.length - 1 - index}`}>
            {" "}
            <h2 style={{ marginTop: "0" }}> {blog.title} </h2>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default BlogList;
