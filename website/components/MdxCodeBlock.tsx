import React from "react";
import { CodeBlock, CodeLang } from "./CodeBlock";

/** Fence languages that don't map 1:1 onto a registered hljs grammar. */
const LANG_ALIASES: Record<string, CodeLang> = {
  shell: "bash",
  sh: "bash",
};

/**
 * `remark-math` (configured in vite.config.ts) also renders through `<pre><code class="language-math ...">`
 * — the same shape as a fenced code block, but it's not one. `useKaTeXRenderer.ts` finds these via
 * `querySelectorAll("code.language-math")` and replaces them with real KaTeX markup client-side.
 * MdxPre must leave this class untouched, or that selector stops matching and math silently stops
 * rendering (this exact regression happened once already — hence the dedicated check and test).
 */
function isMathFence(className?: string): boolean {
  return /(^|\s)language-math(\s|$)/.test(className ?? "");
}

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
 * This adapter, passed to the compiled MDX component as its `components.pre` prop (see Post.tsx —
 * MDX here is compiled without `providerImportSource`, so it reads overrides from `props.components`,
 * not from `MDXProvider` context), redirects that markup through CodeBlock for highlighting + copy
 * support. Falls back to a plain `<pre>` for a `language-math` fence (see isMathFence above) or for
 * any `pre` that doesn't have the expected single `<code>` child (defensive — MDX always produces
 * this shape for fenced blocks, but `pre` can in principle appear standalone in hand-written MDX/HTML).
 */
export function MdxPre({ children, ...rest }: React.HTMLAttributes<HTMLPreElement>) {
  const child = React.isValidElement(children) ? children : null;
  const childProps = child?.props as { className?: string; children?: React.ReactNode } | undefined;
  const code = childProps?.children;

  if (!child || typeof code !== "string" || isMathFence(childProps?.className)) {
    return <pre {...rest}>{children}</pre>;
  }

  return <CodeBlock lang={resolveLang(childProps?.className)}>{code.replace(/\n$/, "")}</CodeBlock>;
}
