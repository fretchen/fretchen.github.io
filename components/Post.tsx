/**
 * This component is used to display a blog post.
 */

import React from "react";
import { MuiMarkdown } from "mui-markdown";

export function Post({ title, content }: { title: string; content: string }) {
  return (
    <>
      <h2>{title}</h2>
      <MuiMarkdown>{content}</MuiMarkdown>
    </>
  );
}
