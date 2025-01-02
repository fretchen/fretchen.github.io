/**
 * This component is used to display a blog post.
 */

import React from "react";
import Markdown from "react-markdown";
import { BlogPost } from "../types/BlogPost";
export function Post({ title, content, publishing_date }: BlogPost) {
  return (
    <>
      <h2>{title}</h2>
      {publishing_date && <p>Published on: {publishing_date}</p>}
      <Markdown>{content}</Markdown>
    </>
  );
}
