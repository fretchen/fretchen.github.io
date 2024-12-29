import * as React from "react";

import { MuiMarkdown } from "mui-markdown";
import blogs from "../../blog/blogs.json";

const App: React.FC = function () {
  console.log(blogs);
  return (
    <div className="App">
      <h1>Welcome to React Vite Micro App!</h1>
      <p>Hard to get more minimal than this small React app.</p>
      {blogs.map((blog, index) => (
        <div key={index}>
          <h2>{blog.title}</h2>
          <MuiMarkdown>{blog.content}</MuiMarkdown>
        </div>
      ))}
    </div>
  );
};

export default App;