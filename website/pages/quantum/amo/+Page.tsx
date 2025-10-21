import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../../components/EntryList";
import { usePageContext } from "vike-react/usePageContext";
import { titleBar } from "../../../layouts/styles";
import { css } from "../../../styled-system/css";
import type { BlogPost } from "../../../types/BlogPost";

const App: React.FC = function () {
  // Get pre-loaded data from +data.ts
  const pageContext = usePageContext();
  const { blogs } = pageContext.data as { blogs: BlogPost[] };

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
