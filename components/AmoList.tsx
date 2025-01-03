import * as React from "react";

import blogs from "../amo/blogs.json";
import { Link } from "./Link";

const AmoList: React.FC = function () {
  return (
    <div className="AmoList">
      {blogs.map((blog, index) => (
        <div key={index} style={{ marginBottom: "20px" }}>
          {blog.publishing_date && <p style={{ marginBottom: "5px" }}>{blog.publishing_date}</p>}
          <Link href={`/amo/${index}`}>
            {" "}
            <h2 style={{ marginTop: "0" }}> {blog.title} </h2>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default AmoList;
