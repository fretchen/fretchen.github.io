import React, { useRef, useEffect } from "react";
import mermaid from "mermaid";
import { css } from "../styled-system/css";

interface MermaidDiagramProps {
  /** The mermaid diagram definition string */
  definition: string;
  /** Title displayed above the diagram */
  title: string;
  /** Fallback content to display if diagram rendering fails */
  fallbackContent: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Custom mermaid configuration */
  config?: Record<string, unknown>;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  definition,
  title,
  fallbackContent,
  className,
  config = {},
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidRef.current) return;

      try {
        // Initialize mermaid with custom config merged with defaults
        const defaultConfig = {
          startOnLoad: false,
          theme: "default" as const,
          securityLevel: "loose" as const,
        };

        mermaid.initialize({ ...defaultConfig, ...config });

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
          // Render fallback content if provided as React node
          if (React.isValidElement(fallbackContent)) {
            const fallbackContainer = document.createElement("div");
            mermaidRef.current.appendChild(fallbackContainer);
            // For React elements, we need to render them properly
            // For now, we'll convert to string if it's a simple element
            mermaidRef.current.innerHTML = `<div>${fallbackContent}</div>`;
          } else {
            // If fallbackContent is a string or HTML
            mermaidRef.current.innerHTML =
              typeof fallbackContent === "string" ? fallbackContent : String(fallbackContent);
          }
        }
      }
    };

    renderDiagram();
  }, [definition, config, fallbackContent]);

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
