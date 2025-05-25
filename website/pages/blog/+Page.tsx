import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../components/EntryList";
import blogs from "../../blog/blogs.json";
import TitleBar from "../../components/TitleBar";
import * as styles from "../../layouts/styles";

const App: React.FC = function () {
  return (
    <div className={styles.container}>
      <TitleBar title="Welcome to my blog!" />
      <p className={styles.paragraph}>It contains notes about all kind of topic, ideas etc.</p>

      {/* Direkte Verwendung von EntryList ohne Umweg über BlogList */}
      <EntryList blogs={blogs} basePath="/blog" showDate={true} reverseOrder={true} />
    </div>
  );
};

export default App;
