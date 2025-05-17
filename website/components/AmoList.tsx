import * as React from "react";
import blogs from "../amo/blogs.json";
import { Link } from "./Link";
import { css } from "../styled-system/css";

const AmoList: React.FC = function () {
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "md",
      })}
    >
      {blogs.map((blog, index) => (
        <div
          key={index}
          className={css({
            marginBottom: "md",
            borderBottom: "1px solid token(colors.border)",
            paddingBottom: "sm",
            _last: { borderBottom: "none" },
          })}
        >
          <Link href={`/amo/${index}`}>
            <h2 className={css({ margin: "0" })}>{blog.title}</h2>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default AmoList;
