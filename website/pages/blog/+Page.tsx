import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../components/EntryList";
import blogs from "../../blog/blogs.json";
import TitleBar from "../../components/TitleBar";
import { css } from "../../styled-system/css";

const App: React.FC = function () {
  return (
    <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
      <TitleBar title="Welcome to my blog!" />
      <p className={css({ marginBottom: "md", lineHeight: "1.5" })}>
        It contains notes about all kind of topic, ideas etc.
      </p>

      {/* Direkte Verwendung von EntryList ohne Umweg über BlogList */}
      <EntryList blogs={blogs} basePath="/blog" showDate={true} reverseOrder={true} />
    </div>
  );
};

export default App;
