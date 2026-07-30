import React from "react";
import { CodeBlock, CodeLang } from "./CodeBlock";

/** Fence languages that don't map 1:1 onto a registered hljs grammar. */
const LANG_ALIASES: Record<string, CodeLang> = {
  shell: "bash",
  sh: "bash",
};

function resolveLang(className?: string): CodeLang {
  const match = /language-(\w+)/.exec(className ?? "");
  const raw = match?.[1];
  if (!raw) return "plaintext";
  const aliased = LANG_ALIASES[raw] ?? raw;
  switch (aliased) {
    case "typescript":
    case "json":
    case "bash":
    case "javascript":
    case "python":
    case "yaml":
      return aliased;
    default:
      return "plaintext";
  }
}

/**
 * MDX renders fenced code blocks as `<pre><code className="language-xxx">...</code></pre>`.
 * This adapter, passed to `MDXProvider` as the `pre` override, redirects that markup through
 * CodeBlock for highlighting + copy support. Falls back to a plain `<pre>` for any `pre` that
 * doesn't have the expected single `<code>` child (defensive — MDX always produces this shape
 * for fenced blocks, but `pre` can in principle appear standalone in hand-written MDX/HTML).
 */
export function MdxPre({ children, ...rest }: React.HTMLAttributes<HTMLPreElement>) {
  const child = React.isValidElement(children) ? children : null;
  const childProps = child?.props as { className?: string; children?: React.ReactNode } | undefined;
  const code = childProps?.children;

  if (!child || typeof code !== "string") {
    return <pre {...rest}>{children}</pre>;
  }

  return <CodeBlock lang={resolveLang(childProps?.className)}>{code.replace(/\n$/, "")}</CodeBlock>;
}
