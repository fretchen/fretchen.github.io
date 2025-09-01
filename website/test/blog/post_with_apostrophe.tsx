import React from "react";

const PostWithApostrophe: React.FC = () => {
  return (
    <article>
      <h1>Test Post with Apostrophe</h1>
      <p>This is a test post to verify that titles with apostrophes are handled correctly.</p>
    </article>
  );
};

// Post metadata
export const meta = {
  title: "The Prisoner's Dilemma Test",
  publishing_date: "2024-12-03",
};

export default PostWithApostrophe;
