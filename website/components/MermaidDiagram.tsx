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
    const caller = (configKey ? (JSON.parse(configKey) as Record<string, unknown>) : {}) as Record<string, unknown>;
    return {
      startOnLoad: false,
      theme: "default" as const,
      securityLevel: "sandbox" as const,
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
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        textAlign: "center",
      })} ${className || ""}`}
    >
      <h4
        className={css({
          fontSize: "16px",
          fontWeight: "medium",
          marginBottom: "16px",
          color: "#374151",
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
