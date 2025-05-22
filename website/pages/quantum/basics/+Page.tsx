import * as React from "react";

import AmoList from "../../../components/BasicsList";
import TitleBar from "../../../components/TitleBar";
const App: React.FC = function () {
  return (
    <div className="AMO">
      <TitleBar title="AMO lecture notes" />
      <p>
        {" "}
        Welcome, to my lecture notes on Atomic, Molecular and Optical physics that I prepared in my time in Heidelberg.
        They consist of a total of 20 lectures, which I will recollect here again.
      </p>
      <AmoList />
    </div>
  );
};

export default App;
