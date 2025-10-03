import * as React from "react";

// Dynamic blog loading with hot reload support
import EntryList from "../../components/EntryList";
import { usePageContext } from "vike-react/usePageContext";
import * as styles from "../../layouts/styles";

const App: React.FC = function () {
  // Get pre-loaded data from +data.ts
  const pageContext = usePageContext();
  const { blogs } = pageContext.data;

  return (
    <div className={styles.container}>
      <h1 className={styles.titleBar.title}>Welcome to my blog!</h1>
      <p className={styles.paragraph}>It contains notes about all kind of topic, ideas etc.</p>

      {/* Dynamic blog loading with hot reload support */}
      <EntryList blogs={blogs} basePath="/blog" showDate={true} reverseOrder={true} />
    </div>
  );
};

export default App;
