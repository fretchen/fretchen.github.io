import * as React from "react";

import blogs from "../../amo/blogs.json";
import AmoList from "../../components/AmoList";

const App: React.FC = function () {
  console.log(blogs);
  return (
    <div className="AMO">
      <h1>Welcome to my lecture notes on AMO!</h1>
      <AmoList />
    </div>
  );
};

export default App;
