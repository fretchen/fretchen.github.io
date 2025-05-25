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
import TitleBar from "./TitleBar";
import { Link } from "./Link";
import { post } from "../layouts/styles";
import "katex/dist/katex.min.css";

import Giscus from "@giscus/react";

// Erweiterte Props für die Post-Komponente
interface PostProps extends BlogPost {
  // Navigation Props
  prevPost?: { title: string; id: number } | null;
  nextPost?: { title: string; id: number } | null;
  basePath?: string; // z.B. "/amo", "/quantum/basics", etc.
}

export function Post({ title, content, publishing_date, prevPost, nextPost, basePath = "" }: PostProps) {
  return (
    <>
      <TitleBar title={title} />
      {publishing_date && <p className={post.publishingDate}>Published on: {publishing_date}</p>}

      <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
        {content}
      </Markdown>

      {/* Navigation zwischen Posts, nur angezeigt wenn vorhanden */}
      {(prevPost || nextPost) && (
        <div className={post.navigation}>
          {prevPost ? (
            <div className={`${post.navLink} ${post.navLinkPrev}`}>
              <Link href={`${basePath}/${prevPost.id}`}>
                <span className={post.navLabel}>Previous: </span>
                <span className={post.navTitle}>{prevPost.title}</span>
              </Link>
            </div>
          ) : (
            <div></div> // Platzhalter für Flex-Layout
          )}

          {nextPost ? (
            <div className={`${post.navLink} ${post.navLinkNext}`}>
              <Link href={`${basePath}/${nextPost.id}`}>
                <span className={post.navLabel}>Next: </span>
                <span className={post.navTitle}>{nextPost.title}</span>
              </Link>
            </div>
          ) : (
            <div></div> // Platzhalter für Flex-Layout
          )}
        </div>
      )}

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
