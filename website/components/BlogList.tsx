import * as React from "react";
import blogs from "../blog/blogs.json";
import { Link } from "./Link";
import { css } from "../styled-system/css";

const BlogList: React.FC = function () {
  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "md" })}>
      {[...blogs].reverse().map((blog, index) => (
        <div
          key={blogs.length - 1 - index}
          className={css({
            marginBottom: "md",
            borderBottom: "1px solid token(colors.border)",
            paddingBottom: "sm",
            _last: { borderBottom: "none" },
          })}
        >
          {blog.publishing_date && (
            <p
              className={css({
                margin: "0",
                fontSize: "sm",
                color: "text",
              })}
            >
              {blog.publishing_date}
            </p>
          )}
          <Link href={`/blog/${blogs.length - 1 - index}`}>
            <h2 className={css({ margin: "0", marginTop: "xs" })}>{blog.title}</h2>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default BlogList;
