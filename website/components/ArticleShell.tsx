import React from "react";
import { articleShell } from "./ArticleShell.styles";

interface ArticleShellProps {
  /** Title and metadata. Occupies its own grid row above the body — see ArticleShell.styles. */
  header?: React.ReactNode;
  /** Table of contents. Rendered in the sidebar column; hidden below 1200px. */
  toc?: React.ReactNode;
  /** The body. */
  children: React.ReactNode;
}

/**
 * The reading-page grid: a centred content column with an optional sticky ToC beside it.
 *
 * Shared by blog/quantum posts (via Post) and the agent-onboarding page, which previously
 * hand-rolled this same markup while importing the styles from Post.styles — leaving the
 * grid defined in a file named after a component that wasn't rendering it, and free to
 * drift between the two callers.
 *
 * Deliberately layout only: it knows nothing about microformats, webmentions, metadata or
 * comments. Those belong to whatever renders inside it.
 */
export function ArticleShell({ header, toc, children }: ArticleShellProps) {
  return (
    <div className={articleShell.layout}>
      {header && <header className={articleShell.header}>{header}</header>}
      <div className={articleShell.content}>{children}</div>
      {toc && <aside className={articleShell.sidebar}>{toc}</aside>}
    </div>
  );
}
