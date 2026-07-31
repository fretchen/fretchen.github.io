/**
 * CodeBlock — the shared docs code block: syntax-highlighted, copyable.
 *
 * Highlighting runs through highlight.js's *core* build with only the languages we
 * actually use registered. The full `highlight.js` bundle registers ~190 grammars and would
 * push a client chunk past the 700 kB ceiling enforced by utils/checkChunkSizes.ts — never
 * import the default entry point here.
 *
 * Highlighting is synchronous, so it also runs during SSR: the server-rendered HTML already
 * carries the .hljs-* markup. That avoids both a flash of unhighlighted code and a hydration
 * mismatch, which is why this is preferred over an async highlighter for these pages.
 *
 * Visual treatment matches the dark blocks on pages/x402 (#1e1e1e / sm type), so that page
 * can adopt this component later without any visual change.
 */
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import yaml from "highlight.js/lib/languages/yaml";
import "highlight.js/styles/vs2015.css";
import { css } from "../styled-system/css";
import { button } from "../styled-system/recipes";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("yaml", yaml);

/** `plaintext` opts out of highlighting — use it for terminal transcripts and annotated output. */
export type CodeLang = "typescript" | "json" | "bash" | "javascript" | "python" | "yaml" | "plaintext";

const wrapper = css({ position: "relative", mt: "1", mb: "2" });

const block = css({
  bg: "codeSurface",
  color: "codeText",
  p: "4",
  borderRadius: "8px",
  overflowX: "auto",
  fontSize: "sm",
  lineHeight: "1.5",
  whiteSpace: "pre",
  // The global `pre` rule in layouts/panda.css sets a light background; win over it here.
  "& code": { bg: "transparent", p: "0", fontSize: "inherit", color: "inherit" },
});

const copyButton = css({
  position: "absolute",
  top: "2",
  right: "2",
  opacity: 0.7,
  _hover: { opacity: 1 },
  _focusVisible: { opacity: 1, outline: "2px solid", outlineColor: "brand", outlineOffset: "1px" },
});

export interface CodeBlockProps {
  children: string;
  lang?: CodeLang;
}

/**
 * Clipboard availability, read the hydration-safe way: the server snapshot is always false
 * (no navigator there), so the SSR markup and the first client render agree, and React
 * re-renders with the real value straight after hydration.
 */
const subscribeNoop = () => () => {};
const clipboardAvailable = () => typeof navigator !== "undefined" && !!navigator.clipboard;
const clipboardUnavailableOnServer = () => false;

export function CodeBlock({ children, lang = "typescript" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const canCopy = useSyncExternalStore(subscribeNoop, clipboardAvailable, clipboardUnavailableOnServer);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(children).then(
      () => {
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      },
      (err) => console.error("Copy failed", err),
    );
  }, [children]);

  const highlighted = lang === "plaintext" ? null : hljs.highlight(children, { language: lang }).value;

  return (
    <div className={wrapper}>
      <pre className={block}>
        {highlighted === null ? (
          <code className="hljs">{children}</code>
        ) : (
          <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
        )}
      </pre>
      {canCopy && (
        <button type="button" onClick={copy} className={`${button({ visual: "overlay", size: "sm" })} ${copyButton}`} aria-label="Copy code to clipboard">
          {copied ? "Copied!" : "Copy"}
        </button>
      )}
    </div>
  );
}

export default CodeBlock;
