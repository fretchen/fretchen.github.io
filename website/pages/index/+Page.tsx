import React from "react";
import { Card } from "../../components/Card";
import EntryList from "../../components/EntryList";
import { useData } from "vike-react/useData";
import type { BlogPost } from "../../types/BlogPost";
import * as styles from "../../layouts/styles";

export default function Page() {
  const { blogs } = useData<{ blogs: BlogPost[] }>();

  return (
    <div className={styles.container}>
      {/* Hero section */}
      <div className={styles.heroContainer}>
        <h1 className={styles.titleBar.title}>Welcome</h1>
        <p className={styles.heroText}>
          Welcome to my website with all kinds of notes etc. Nothing fancy, just me thinking out loudly.
        </p>
      </div>

      {/* Main areas */}
      <section>
        <h2 className={styles.sectionHeading}>Explore the main areas</h2>

        <div className={styles.cardStack}>
          <Card title="Blog" description="My thoughts on various topics." link="/blog" />
          <Card title="Quantum" description="Tutorials and notes on quantum, AMO and more." link="/quantum" />
          <Card
            title="AI Image Generator"
            description="Create your own images with AI and receive them as NFTs on the blockchain."
            link="/imagegen"
          />
        </div>
      </section>

      {/* Latest blog posts */}
      <section className={styles.blogSection}>
        <h2 className={styles.sectionHeading}>Latest Blog Posts</h2>

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
