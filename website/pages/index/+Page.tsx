import React from "react";
import { Card } from "../../components/Card";
import { CardList } from "../../components/CardList";
import EntryList from "../../components/EntryList";
import { useData } from "vike-react/useData";
import type { BlogPost } from "../../types/BlogPost";
import * as styles from "../../layouts/shared";
import { css } from "../../styled-system/css";
import { PageHeader } from "../../components/PageHeader";

// Page-local styles — nothing else uses these.
// Section header styles
const sectionHeading = css({
  fontSize: "lg",
  fontWeight: "semibold",
  marginBottom: "4",
  paddingBottom: "2",
  borderBottom: "1px solid token(colors.border)",
});
// Blog section styles
const blogSection = css({ marginTop: "10" });

export default function Page() {
  const { blogs } = useData<{ blogs: BlogPost[] }>();

  return (
    <div className={styles.container}>
      {/* Hero section */}
      <PageHeader title="fretchen" territory="voice">
        Notes, essays and things I built while working topics out.
      </PageHeader>

      {/* Main areas */}
      <section>
        <CardList>
          <Card
            title="Blog"
            description="Game theory and economics, quantum physics, and what I learned building on the web."
            link="/blog"
          />
          <Card title="Quantum" description="Tutorials and notes on quantum, AMO and more." link="/quantum" />
          <Card
            title="Lab"
            description="AI image generation, chat assistant, and blockchain-based payments — experiments running on Optimism and Base."
            link="/lab"
          />
        </CardList>
      </section>

      {/* Latest blog posts */}
      <section className={blogSection}>
        <h2 className={sectionHeading}>Latest posts</h2>

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
