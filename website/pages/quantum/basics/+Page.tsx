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
      <h1 className={titleBar.title}>Quantum Basics</h1>
      <span className={sectionRule({ territory: "voice" })} aria-hidden="true" />
      <p className={styles.pageIntro}>
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
