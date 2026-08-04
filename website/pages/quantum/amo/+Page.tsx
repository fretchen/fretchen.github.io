import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../../components/EntryList";
import { usePageContext } from "vike-react/usePageContext";
import { titleBar } from "../../../layouts/shared";
import * as styles from "../../../layouts/shared";
import type { BlogPost } from "../../../types/BlogPost";
import { sectionRule } from "../../../styled-system/recipes";

const App: React.FC = function () {
  // Get pre-loaded data from +data.ts
  const pageContext = usePageContext();
  const { blogs } = pageContext.data as { blogs: BlogPost[] };

  return (
    <div className={styles.container}>
      <h1 className={titleBar.title}>AMO lecture notes</h1>
      <span className={sectionRule({ territory: "voice" })} aria-hidden="true" />
      <p className={styles.pageIntro}>
        Welcome to my lecture notes on Atomic, Molecular and Optical physics that I prepared in my time in Heidelberg.
        They consist of a total of 20 lectures, which I will recollect here again.
      </p>

      <EntryList blogs={blogs} basePath="/quantum/amo" />
    </div>
  );
};

export default App;
