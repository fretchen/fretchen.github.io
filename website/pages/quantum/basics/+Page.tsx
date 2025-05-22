import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../../components/EntryList";
import blogs from "../../../quantum/basics/blogs.json";
import TitleBar from "../../../components/TitleBar";
import { css } from "../../../styled-system/css";

const App: React.FC = function () {
  return (
    <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
      <TitleBar title="Quantum Physics Basics" />
      <p className={css({ marginBottom: "md", lineHeight: "1.5" })}>
        Welcome to my lecture notes on the basics of Quantum Physics. These notes cover fundamental concepts and
        principles that form the foundation of quantum mechanics.
      </p>

      <EntryList blogs={blogs} basePath="/quantum/basics" />
    </div>
  );
};

export default App;
