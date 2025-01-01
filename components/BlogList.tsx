import * as React from "react";

import blogs from "../blog/blogs.json";
import { Link } from "./Link";

const BlogList: React.FC = function () {
  return (
    <div className="BlogList">
      {blogs.map((blog, index) => (
        <div key={index}>
          <h2>{blog.title}</h2>
          <p>
            {" "}
            <Link href={`/blog/${index}`}>Read more</Link>
          </p>
        </div>
      ))}
    </div>
  );
};

export default BlogList;
