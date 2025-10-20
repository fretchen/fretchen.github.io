import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

interface MarkdownWithLatexProps {
  children: string;
  remarkPlugins?: unknown[];
  components?: Partial<Components>;
}

/**
 * Wrapper for ReactMarkdown that handles LaTeX rendering client-side.
 * Used for inline Markdown content in React components (TSX blog posts).
 *
 * Note: This uses auto-render for $$..$$ detection, which works for inline
 * Markdown strings. For .md/.mdx files, use remark-math in vite.config.ts instead.
 */
export const MarkdownWithLatex: React.FC<MarkdownWithLatexProps> = ({
  children,
  remarkPlugins = [],
  components,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Client-side LaTeX rendering after content is mounted
  React.useEffect(() => {
    if (containerRef.current) {
      import("katex/dist/contrib/auto-render")
        .then((module) => {
          const renderMathInElement = module.default;
          if (containerRef.current) {
            renderMathInElement(containerRef.current, {
              delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
              ],
              throwOnError: false,
              strict: false,
              trust: true,
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load KaTeX auto-render:", err);
        });
    }
  }, [children]);

  return (
    <div ref={containerRef}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};
