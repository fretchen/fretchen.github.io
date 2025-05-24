import React from "react";
import { Card } from "../../components/Card";
import EntryList from "../../components/EntryList";
import blogs from "../../blog/blogs.json";
import { css } from "../../styled-system/css";
import { stack } from "../../styled-system/patterns";

export default function Page() {
  return (
    <div className={css({ maxWidth: "900px", mx: "auto", px: "md" })}>
      {/* Hero-Bereich */}
      <div
        className={css({
          textAlign: "center",
          marginY: "8",
        })}
      >
        <h2>Welcome</h2>
        <p
          className={css({
            fontSize: "lg",
            maxWidth: "700px",
            margin: "0 auto",
          })}
        >
          Welcome to my website with all kinds of notes etc. Nothing fancy, just me thinking out loudly.
        </p>
      </div>

      {/* Hauptbereiche */}
      <section>
        <h2
          className={css({
            fontSize: "2xl",
            fontWeight: "semibold",
            marginBottom: "4",
            paddingBottom: "2",
            borderBottom: "1px solid token(colors.border)",
          })}
        >
          Explore the main areas
        </h2>

        <div className={stack({ gap: "4" })}>
          <Card title="Blog" description="My thoughts on various topics." link="/blog" />
          <Card title="Quantum" description="Tutorials and notes on quantum, AMO and more." link="/quantum" />

          <Card
            title="AI Image Generator"
            description="Create your own images with AI and receive them as NFTs on the blockchain."
            link="/imagegen"
          />
        </div>
      </section>

      {/* Neueste Blog-Posts */}
      <section className={css({ marginTop: "10" })}>
        <h2
          className={css({
            fontSize: "2xl",
            fontWeight: "semibold",
            marginBottom: "4",
            paddingBottom: "2",
            borderBottom: "1px solid token(colors.border)",
          })}
        >
          Latest Blog Posts
        </h2>

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
