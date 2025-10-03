import * as React from "react";

// Dynamic blog loading with hot reload support
import EntryList from "../../../components/EntryList";
import { useBlogData } from "../../../hooks/useBlogData";
import { titleBar } from "../../../layouts/styles";
import { css } from "../../../styled-system/css";

const App: React.FC = function () {
  const { blogs, loading, error } = useBlogData("quantum/amo", "order");

  if (loading) {
    return (
      <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
        <h1 className={titleBar.title}>AMO lecture notes</h1>
        <p>Loading lecture notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
        <h1 className={titleBar.title}>AMO lecture notes</h1>
        <p>Error loading lecture notes: {error}</p>
      </div>
    );
  }

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
