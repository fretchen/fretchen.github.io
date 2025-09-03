import * as React from "react";

// Direkte Imports der benötigten Komponenten und Daten
import EntryList from "../../components/EntryList";
import blogs from "../../blog/blogs.json";
import * as styles from "../../layouts/styles";
import { useTranslation } from "react-i18next";
import { usePageContext } from "vike-react/usePageContext";

const App: React.FC = function () {
  const pageContext = usePageContext();
  const locale = pageContext.locale;
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h1>{t("products.title")}</h1>
      <h1 className={styles.titleBar.title}>Welcome to my blog!</h1>
      <p className={styles.paragraph}>It contains notes about all kind of topic, ideas etc.</p>

      {/* Direkte Verwendung von EntryList ohne Umweg über BlogList */}
      <EntryList blogs={blogs} basePath="/blog" showDate={true} reverseOrder={true} />
    </div>
  );
};

export default App;
