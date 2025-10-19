import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../../components/EntryList";
import { useBlogData } from "../../../hooks/useBlogData";
import { titleBar } from "../../../layouts/styles";
import { css } from "../../../styled-system/css";

const App: React.FC = function () {
  const { blogs } = useBlogData("quantum/amo", "order");

  return (
    <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
      <h1 className={titleBar.title}>AMO lecture notes</h1>
      <p className={css({ marginBottom: "md", lineHeight: "1.5" })}>
        Welcome to my lecture notes on Atomic, Molecular and Optical physics that I prepared in my time in Heidelberg.
        They consist of a total of 20 lectures, which I will recollect here again.
      </p>

      <EntryList blogs={blogs} basePath="/quantum/amo" />
    </div>
  );
};

export default App;
