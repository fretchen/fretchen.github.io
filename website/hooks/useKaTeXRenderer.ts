import React from "react";

/**
 * Custom hook for client-side KaTeX rendering.
 * Handles both remark-math output (code.language-math elements) and fallback $$ syntax.
 *
 * @param containerRef - React ref to the container element
 * @param isReady - Boolean indicating when to start rendering (e.g., when component is loaded)
 */
export function useKaTeXRenderer(containerRef: React.RefObject<HTMLElement | null>, isReady: boolean) {
  React.useEffect(() => {
    if (!containerRef.current || !isReady) {
      return;
    }

    // Delay to ensure content has fully rendered
    const timer = setTimeout(() => {
      // Dynamically import KaTeX only in the browser
      Promise.all([import("katex"), import("katex/dist/contrib/auto-render")])
        .then(([katexModule, autoRenderModule]) => {
          const katex = katexModule.default;
          const renderMathInElement = autoRenderModule.default;

          if (!containerRef.current) return;

          // STEP 1: Handle remark-math output (code.language-math elements)
          // remark-math creates <code class="language-math math-display"> without $$ delimiters
          const mathElements = containerRef.current.querySelectorAll("code.language-math");

          mathElements.forEach((element) => {
            try {
              const mathContent = element.textContent || "";
              const isDisplay = element.classList.contains("math-display");

              // Create a span to hold the rendered math
              const span = document.createElement("span");

              // Render with KaTeX directly
              katex.render(mathContent, span, {
                displayMode: isDisplay,
                throwOnError: false,
                strict: false,
                trust: true,
              });

              // Replace the code element with rendered math
              element.parentNode?.replaceChild(span, element);
            } catch (err) {
              console.error("KaTeX error rendering math element:", err);
            }
          });

          // STEP 2: Also run auto-render for any remaining $$ syntax (fallback)
          renderMathInElement(containerRef.current, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false },
            ],
            throwOnError: false,
            strict: false,
            trust: true,
            ignoredTags: [],
            ignoredClasses: [],
          });
        })
        .catch((err) => {
          console.error("Failed to load KaTeX:", err);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [containerRef, isReady]);
}
