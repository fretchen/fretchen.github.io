import React, { useRef, useEffect, useMemo } from "react";
import { css } from "../styled-system/css";

/**
 * Sequence-diagram defaults. `mirrorActors` defaults to true in mermaid, which redraws the
 * entire participant row again at the bottom of the diagram — on these pages that is ~75px
 * of dead whitespace, since the labels are already visible at the top.
 */
const SEQUENCE_DEFAULTS = { mirrorActors: false };

interface MermaidDiagramProps {
  /** The mermaid diagram definition string */
  definition: string;
  /** Title displayed above the diagram */
  title: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Custom mermaid configuration */
  config?: Record<string, unknown>;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ definition, title, className, config }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Callers pass `config` as an inline object literal, which is a fresh reference on every
  // render — depending on it directly would re-render the diagram on every parent render.
  // Key the effect on its serialized form instead.
  const configKey = config ? JSON.stringify(config) : "";

  const resolvedConfig = useMemo(() => {
    const caller = (configKey ? (JSON.parse(configKey) as unknown) : {}) as Record<string, unknown>;
    return {
      startOnLoad: false,
      theme: "default" as const,
      // "strict" (mermaid's own default), NOT "sandbox". Under "sandbox" mermaid returns an
      // <iframe> whose height is the diagram's *unscaled* viewBox height in px, while the SVG
      // inside scales down to the container width — the difference is dead whitespace at the
      // bottom, growing with the diagram's width, and no page CSS can reach inside to fix it.
      // "strict" returns an inline <svg>, so the `& svg { height: auto }` rule below applies
      // and the height tracks the scaled width exactly. Labels and the rendered SVG are still
      // DOMPurify-sanitized under "strict"; the only thing given up is iframe isolation, which
      // guards against untrusted diagram text — every definition we render is a hardcoded
      // constant in our own source.
      securityLevel: "strict" as const,
      ...caller,
      // Merge one level deeper than the spread above: a caller passing any `sequence` key
      // (e.g. { sequence: { wrap: true } }) would otherwise silently drop mirrorActors.
      sequence: { ...SEQUENCE_DEFAULTS, ...((caller.sequence as Record<string, unknown>) ?? {}) },
    };
  }, [configKey]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidRef.current) return;

      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize(resolvedConfig);

        // Generate unique ID for this diagram
        const id = `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, definition);

        // Insert the SVG into the DOM
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error);
        if (mermaidRef.current) {
          mermaidRef.current.textContent = "Diagram konnte nicht gerendert werden.";
        }
      }
    };

    void renderDiagram();
  }, [definition, resolvedConfig]);

  return (
    <div
      className={`${css({
        margin: "20px 0",
        padding: "5",
        backgroundColor: "codeBg",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        textAlign: "center",
      })} ${className || ""}`}
    >
      <h4
        className={css({
          fontSize: "md",
          fontWeight: "medium",
          marginBottom: "4",
          color: "gray.700",
        })}
      >
        {title}
      </h4>
      <div
        ref={mermaidRef}
        className={css({
          "& svg": {
            maxWidth: "100%",
            height: "auto",
          },
        })}
      />
    </div>
  );
};

export default MermaidDiagram;
