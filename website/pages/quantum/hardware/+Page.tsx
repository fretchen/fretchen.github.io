import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../../components/EntryList";
import { usePageContext } from "vike-react/usePageContext";
import * as styles from "../../../layouts/shared";
import type { BlogPost } from "../../../types/BlogPost";
import { PageHeader } from "../../../components/PageHeader";

const App: React.FC = function () {
  // Get pre-loaded data from +data.ts
  const pageContext = usePageContext();
  const { blogs } = pageContext.data as { blogs: BlogPost[] };

  return (
    <div className={styles.container}>
      <PageHeader title="Quantum Hardware" territory="voice">
        Quantum technologies are rapidly evolving and different applications require very different hardware platforms.
        Especially for computational tasks there is a fierce competition with unknown outcome. In this series of
        tutorials on quantum hardware, we provide a basic introduction into some of the fundamental concepts behind
        leading hardware platforms like superconducting qubits, trapped ions or cold atoms.
      </PageHeader>

      <h2>Requirements</h2>
      <p>
        Knowledge of basic notions of quantum mechanics is assumed. Quite frankly this is most likely the mathematical
        series here as it based on lectures we gave at the university to physics majors.
      </p>

      <EntryList blogs={blogs} basePath="/quantum/hardware" />
    </div>
  );
};

export default App;
