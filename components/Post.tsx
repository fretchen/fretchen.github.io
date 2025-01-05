/**
 * This component is used to display a blog post.
 */

import React from "react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { BlogPost } from "../types/BlogPost";
import "katex/dist/katex.min.css";

import Giscus from "@giscus/react";

export function Post({ title, content, publishing_date }: BlogPost) {
  return (
    <>
      <h1>{title}</h1>
      {publishing_date && <p>Published on: {publishing_date}</p>}
      <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
        {content}
      </Markdown>
      <Giscus
        id="comments"
        repo="fretchen/fretchen.github.io"
        repoId="MDEwOlJlcG9zaXRvcnkzMzkyNzQ5OA="
        category="General"
        categoryId="DIC_kwDOAgWxSs4ClveO"
        mapping="pathname"
        term="Welcome to @giscus/react component!"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="light"
        lang="en"
        loading="lazy"
      />
    </>
  );
}
