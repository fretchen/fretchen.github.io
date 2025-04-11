import * as React from "react";
import { useAccount, useEnsName } from "wagmi";

import BlogList from "../../components/BlogList";

const App: React.FC = function () {
  return (
    <div className="Blog">
      <h1>Welcome to my blog!</h1>
      <p>It contains notes about all kind of topic, ideas etc.</p>
      <BlogList />
    </div>
  );
};

export default App;
