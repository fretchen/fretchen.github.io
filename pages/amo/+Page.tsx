import * as React from "react";

import blogs from "../../amo/blogs.json";
import AmoList from "../../components/AmoList";

const App: React.FC = function () {
  console.log(blogs);
  return (
    <div className="AMO">
      <h1>AMO lecture notes</h1>
      <p>
        {" "}
        Welcome, to my lecture notes on Atomic, Molecular and Optical physics that I prepared in my time in Heidelberg.
        They consist of a total of 24 lectures, which I will recollect here again.
      </p>
      <AmoList />
    </div>
  );
};

export default App;
