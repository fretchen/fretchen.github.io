import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../../components/EntryList";
import blogs from "../../../quantum/qml/blogs.json";
import { titleBar } from "../../../layouts/styles";
import { css } from "../../../styled-system/css";

const App: React.FC = function () {
  return (
    <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
      <h1 className={titleBar.title}>Beginners guide to Quantum Machine Learning</h1>
      <p className={css({ marginBottom: "md", lineHeight: "1.5" })}>
        Classical machine learning has changed the internet in a dramatic fashion. Because of this, researchers put a
        substantial effort into the develop of quantum machine learning. In this series of tutorials on quantum
        technologies, we provide a basic introduction into some of the fundamental concepts behind supervised quantum
        machine learning algorithms.
      </p>

      <h2>Requirements</h2>
      <p>
        Knowledge of basic notions of quantum computing is assumed. We provide the programming examples in{" "}
        <code>qiskit</code>.
      </p>

      <ul className={css({ paddingLeft: "2em", marginBottom: "md" })}>
        <li>
          So if both things are known to you, you can directly start out. Otherwise, the introductory chapters of the
          qiskit textbook might be a great starting point.
        </li>
        <li>
          Knowledge of classical supervised learning is not really necessary, but certainly helpful. The Coursera course
          by deeplearning.ai is awesome.
        </li>
      </ul>

      <EntryList blogs={blogs} basePath="/quantum/qml" />
    </div>
  );
};

export default App;
