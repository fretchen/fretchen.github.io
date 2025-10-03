import * as React from "react";

// Dynamic blog loading with hot reload support
import EntryList from "../../../components/EntryList";
import { useBlogData } from "../../../hooks/useBlogData";
import { titleBar } from "../../../layouts/styles";
import { css } from "../../../styled-system/css";

const App: React.FC = function () {
  const { blogs, loading, error } = useBlogData("quantum/basics", "order");

  if (loading) {
    return (
      <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
        <h1 className={titleBar.title}>Quantum Basics</h1>
        <p>Loading tutorials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
        <h1 className={titleBar.title}>Quantum Basics</h1>
        <p>Error loading tutorials: {error}</p>
      </div>
    );
  }

  return (
    <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
      <h1 className={titleBar.title}>Quantum Basics</h1>
      <p className={css({ marginBottom: "md", lineHeight: "1.5" })}>
        The hipster role is rather new to the quantum sector which has largely evolved under the radar to the greater
        public for the last one hundred years. To bring this into context, we will summarize some basic concepts of
        quantum physics and then discuss the four pillars of quantum technologies. Finishing this series of tutorials,
        will provide you a better background on large government programs like the European flagship on quantum
        technologies.
      </p>

      <h2>Requirements</h2>
      <p>
        The whole course will be conducted without the need of any math or programming skills. We therefore think that
        it should be the most accessible to the broader public.
      </p>

      <EntryList blogs={blogs} basePath="/quantum/basics" />
    </div>
  );
};

export default App;
