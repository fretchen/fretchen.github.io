import React from "react";
import { Card } from "../../components/Card";
import EntryList from "../../components/EntryList";
import { useData } from "vike-react/useData";
import type { BlogPost } from "../../types/BlogPost";
import * as styles from "../../layouts/shared";
import { css } from "../../styled-system/css";
import { stack } from "../../styled-system/patterns";

// Page-local styles — nothing else uses these.
const heroContainer = css({
  textAlign: "center",
  marginY: "8",
});
const heroText = css({
  fontSize: "lg",
  maxWidth: "700px",
  margin: "0 auto",
});
// Section header styles
const sectionHeading = css({
  fontSize: "2xl",
  fontWeight: "semibold",
  marginBottom: "4",
  paddingBottom: "2",
  borderBottom: "1px solid token(colors.border)",
});
// Card layout styles
const cardStack = stack({ gap: "4" });
// Blog section styles
const blogSection = css({ marginTop: "10" });

export default function Page() {
  const { blogs } = useData<{ blogs: BlogPost[] }>();

  return (
    <div className={styles.container}>
      {/* Hero section */}
      <div className={heroContainer}>
        <h1 className={styles.titleBar.title}>Welcome</h1>
        <p className={heroText}>
          Welcome to my website with all kinds of notes etc. Nothing fancy, just me thinking out loudly.
        </p>
      </div>

      {/* Main areas */}
      <section>
        <h2 className={sectionHeading}>Explore the main areas</h2>

        <div className={cardStack}>
          <Card title="Blog" description="My thoughts on various topics." link="/blog" />
          <Card title="Quantum" description="Tutorials and notes on quantum, AMO and more." link="/quantum" />
          <Card
            title="Lab"
            description="AI image generation, chat assistant, and blockchain-based payments — experiments running on Optimism and Base."
            link="/lab"
          />
        </div>
      </section>

      {/* Latest blog posts */}
      <section className={blogSection}>
        <h2 className={sectionHeading}>Latest Blog Posts</h2>

        <EntryList
          blogs={blogs}
          basePath="/blog"
          showDate={true}
          reverseOrder={true}
          limit={3}
          showViewAllLink={true}
        />
      </section>
    </div>
  );
}
