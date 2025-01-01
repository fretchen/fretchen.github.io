import * as React from "react";

import blogs from "../../blog/blogs.json";
import { Link } from "../../components/Link";

const App: React.FC = function () {
  console.log(blogs);
  return (
    <div className="Blog">
      <h1>Welcome to my blog!</h1>
      <p>It contains notes about all kind of topic, ideas etc.</p>
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

export default App;
