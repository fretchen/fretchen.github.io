import * as React from "react";

// Dynamic blog loading with hot reload support
import EntryList from "../../components/EntryList";
import { useBlogData } from "../../hooks/useBlogData";
import * as styles from "../../layouts/styles";

const App: React.FC = function () {
  // Use dynamic blog loading instead of static JSON import
  const { blogs, loading, error } = useBlogData("blog", "publishing_date");

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.titleBar.title}>Welcome to my blog!</h1>
        <p className={styles.paragraph}>Loading blog posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.titleBar.title}>Welcome to my blog!</h1>
        <p className={styles.paragraph}>Error loading blog posts: {error}</p>
      </div>
    );
  }

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
