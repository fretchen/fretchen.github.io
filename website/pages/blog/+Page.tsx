import * as React from "react";
import { useState } from "react";

// Dynamic blog loading with hot reload support
import EntryList from "../../components/EntryList";
import { usePageContext } from "vike-react/usePageContext";
import * as styles from "../../layouts/styles";
import { css } from "../../styled-system/css";
import { CATEGORIES, getCategoryIds, type CategoryId } from "../../types/Categories";
import type { BlogPost } from "../../types/BlogPost";

const App: React.FC = function () {
  // Get pre-loaded data from +data.ts
  const pageContext = usePageContext();
  const { blogs } = pageContext.data as { blogs: BlogPost[] };

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);

  // Filter Logic
  const filteredBlogs = selectedCategory
    ? blogs.filter((blog) => blog.category === selectedCategory || blog.secondaryCategory === selectedCategory)
    : blogs;

  return (
    <div className={styles.container}>
      <h1 className={styles.titleBar.title}>Welcome to my blog!</h1>
      <p className={styles.paragraph}>It contains notes about all kind of topic, ideas etc.</p>

      {/* Category Filter Buttons */}
      <div
        className={css({
          display: "flex",
          gap: "sm",
          marginTop: "lg",
          marginBottom: "lg",
          flexWrap: "wrap",
        })}
      >
        <button
          onClick={() => setSelectedCategory(null)}
          className={selectedCategory === null ? styles.categoryFilterButtonActive : styles.categoryFilterButton}
        >
          All Categories
        </button>

        {getCategoryIds().map((categoryId) => {
          const category = CATEGORIES[categoryId];
          const isSelected = selectedCategory === categoryId;

          return (
            <button
              key={categoryId}
              onClick={() => setSelectedCategory(categoryId)}
              className={isSelected ? styles.categoryFilterButtonActive : styles.categoryFilterButton}
            >
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filtered Results Counter */}
      {selectedCategory && (
        <p className={css({ fontSize: "sm", color: "gray.600", marginBottom: "md" })}>
          Showing {filteredBlogs.length} post{filteredBlogs.length !== 1 ? "s" : ""} in{" "}
          {CATEGORIES[selectedCategory].label}
        </p>
      )}

      {/* Dynamic blog loading with hot reload support */}
      <EntryList blogs={filteredBlogs} basePath="/blog" showDate={true} reverseOrder={true} />
    </div>
  );
};

export default App;
