import * as React from "react";

import AmoList from "../../components/AmoList";

const App: React.FC = function () {
  return (
    <div className="AMO">
      <h1>AMO lecture notes</h1>
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
