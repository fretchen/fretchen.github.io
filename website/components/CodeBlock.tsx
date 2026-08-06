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
 * The block is *light* — see the `codeSurface` comment in panda.config.ts for why. That is
 * also why no highlight.js theme stylesheet is imported: every stock theme ships its own
 * palette, and the rules below map the .hljs-* classes onto the site's own tokens instead.
 * Anything not listed simply inherits `codeText`, which is the intended fallback.
 */
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import yaml from "highlight.js/lib/languages/yaml";
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
  border: "1px solid",
  borderColor: "border",
  borderRadius: "lg",
  overflowX: "auto",
  fontSize: "sm",
  lineHeight: "normal",
  whiteSpace: "pre",
  // The global `pre` rule in layouts/panda.css sets its own background; win over it here.
  "& code": { bg: "transparent", p: "0", fontSize: "inherit", color: "inherit" },

  // The syntax palette. Grouped by what the token *is*, so a grammar we add later lands on
  // a sensible colour without a new rule: literals and language words are `explore`, data
  // read out of the source is `brand`, quoted text is `codeString`, and anything the
  // author wrote for a human is `textMuted`.
  "& .hljs-comment, & .hljs-quote": { color: "textMuted", fontStyle: "italic" },
  "& .hljs-meta, & .hljs-doctag": { color: "textMuted" },
  "& .hljs-keyword, & .hljs-built_in, & .hljs-literal, & .hljs-type, & .hljs-selector-tag": {
    color: "explore",
  },
  // `.hljs-char` and not `.hljs-char.escape_`: Panda escapes the dot into the class name, so
  // the compound selector would silently match nothing.
  "& .hljs-string, & .hljs-regexp, & .hljs-char": { color: "codeString" },
  "& .hljs-number, & .hljs-attr, & .hljs-attribute, & .hljs-symbol, & .hljs-variable, & .hljs-template-variable": {
    color: "brand",
  },
  // Names carry weight rather than a fifth hue — the block stays quiet at a glance.
  "& .hljs-title, & .hljs-section, & .hljs-name": { color: "codeText", fontWeight: "semibold" },
});

const copyButton = css({
  position: "absolute",
  top: "2",
  right: "2",
  // `secondary` is transparent by design; over a code block it needs to be opaque, or the
  // first line reads through the button.
  bg: "background",
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
        <button
          type="button"
          onClick={copy}
          className={`${button({ visual: "secondary", size: "sm" })} ${copyButton}`}
          aria-label="Copy code to clipboard"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      )}
    </div>
  );
}

export default CodeBlock;
