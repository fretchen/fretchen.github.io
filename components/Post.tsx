/**
 * This component is used to display a blog post.
 */

import React from "react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { BlogPost } from "../types/BlogPost";
import "katex/dist/katex.min.css";
export function Post({ title, content, publishing_date }: BlogPost) {
  return (
    <>
      <h2>{title}</h2>
      {publishing_date && <p>Published on: {publishing_date}</p>}
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </Markdown>
    </>
  );
}
