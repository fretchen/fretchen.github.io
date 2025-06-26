import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../../components/EntryList";
import blogs from "../../../quantum/hardware/blogs.json";
import { titleBar } from "../../../layouts/styles";
import { css } from "../../../styled-system/css";

const App: React.FC = function () {
  return (
    <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
      <h1 className={titleBar.title}>Quantum Hardware</h1>
      <p className={css({ marginBottom: "md", lineHeight: "1.5" })}>
        Quantum technologies are rapidly evolving and different applications require very different hardware platforms.
        Especially for computational tasks there is a fierce competition with unknown outcome. In this series of
        tutorials on quantum hardware, we provide a basic introduction into some of the fundamental concepts behind
        leading hardware platforms like superconducting qubits, trapped ions or cold atoms.
      </p>

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
