import * as React from "react";

import BlogList from "../../components/BlogList";
import TitleBar from "../../components/TitleBar";

const App: React.FC = function () {
  return (
    <div className="Blog">
      <TitleBar title="Welcome to my blog!" />
      <p>It contains notes about all kind of topic, ideas etc.</p>
      <BlogList />
    </div>
  );
};

export default App;
