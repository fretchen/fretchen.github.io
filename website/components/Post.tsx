import React from "react";
import { PostProps } from "../types/components";
import MetadataLine from "./MetadataLine";
import { Link } from "./Link";
import { NFTFloatImage } from "./NFTFloatImage";
import { post, titleBar } from "../layouts/styles";
import "katex/dist/katex.min.css";

import Giscus from "@giscus/react";

// Dynamic React component renderer
const ReactPostRenderer: React.FC<{ componentPath: string; tokenID?: number }> = ({ componentPath, tokenID }) => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const loadComponent = async () => {
      try {
        // Extract directory and filename from componentPath
        const pathParts = componentPath.replace(/^\.\.\//, "").split("/");
        const directory = pathParts.slice(0, -1).join("/");
        const filename = pathParts[pathParts.length - 1];

        // Use dynamic import to load the component
        // Both MDX and TSX files are React components with a default export
        let module;

        if (directory === "blog") {
          // Load from blog directory using Vite's glob import
          const modules = import.meta.glob<{ default: React.ComponentType }>([
            "../blog/*.tsx",
            "../blog/*.md",
            "../blog/*.mdx",
          ]);

          const modulePath = `../${directory}/${filename}`;
          const loader = modules[modulePath];

          if (!loader) {
            throw new Error(`Module not found in glob: ${modulePath}`);
          }

          module = await loader();
        } else if (directory.startsWith("quantum/")) {
          // Load from quantum directories
          const modules = import.meta.glob<{ default: React.ComponentType }>([
            "../quantum/**/*.tsx",
            "../quantum/**/*.md",
            "../quantum/**/*.mdx",
          ]);

          const modulePath = `../${directory}/${filename}`;
          const loader = modules[modulePath];

          if (!loader) {
            throw new Error(`Module not found in glob: ${modulePath}`);
          }

          module = await loader();
        } else {
          throw new Error(`Unsupported directory: ${directory}`);
        }

        // The component should be the default export (works for both MDX and TSX)
        const LoadedComponent = module.default;

        if (!LoadedComponent) {
          throw new Error(`No default export found in ${filename}`);
        }

        setComponent(() => LoadedComponent);
        setLoading(false);
      } catch (err) {
        console.error("ReactPostRenderer: Error loading React component:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setLoading(false);
      }
    };

    loadComponent();
  }, [componentPath]);

  if (loading) {
    return (
      <div className={post.contentContainer}>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>🔄 Lade interaktive Komponente...</p>
          <p style={{ fontSize: "0.9em", color: "#666" }}>
            Pfad: <code>{componentPath}</code>
          </p>
        </div>
      </div>
    );
  }

  if (error || !Component) {
    return (
      <div className={post.contentContainer}>
        <div
          style={{
            border: "1px solid #dc3545",
            borderRadius: "4px",
            padding: "20px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            margin: "20px 0",
          }}
        >
          <h3>❌ Fehler beim Laden der React-Komponente</h3>
          <p>
            <strong>Fehler:</strong> {error || "Komponente konnte nicht geladen werden"}
          </p>
          <p>
            <strong>Pfad:</strong> <code>{componentPath}</code>
          </p>
          <details style={{ marginTop: "10px" }}>
            <summary>Mögliche Lösungen</summary>
            <ul style={{ marginTop: "10px" }}>
              <li>Überprüfen Sie, ob die TSX-Datei existiert</li>
              <li>Stellen Sie sicher, dass die Komponente als default export verfügbar ist</li>
              <li>Überprüfen Sie die Konsolenausgabe für weitere Details</li>
            </ul>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={post.contentContainer}>
      {tokenID && <NFTFloatImage tokenId={tokenID} />}
      <React.Suspense
        fallback={
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>⚡ Lade Komponente...</p>
          </div>
        }
      >
        <Component />
      </React.Suspense>
    </div>
  );
};

export function Post({ title, publishing_date, prevPost, nextPost, basePath = "", tokenID, componentPath }: PostProps) {
  return (
    <>
      <h1 className={titleBar.title}>{title}</h1>
      <MetadataLine publishingDate={publishing_date} showSupport={true} />

      {/* Render React component (MDX or TSX) */}
      {componentPath && <ReactPostRenderer componentPath={componentPath} tokenID={tokenID} />}

      {/* Navigation zwischen Posts, nur angezeigt wenn vorhanden */}
      {(prevPost || nextPost) && (
        <div className={post.navigation}>
          {prevPost ? (
            <div className={`${post.navLink} ${post.navLinkPrev}`}>
              <Link href={`${basePath}/${prevPost.id}`}>
                <span className={post.navLabel}>Previous: </span>
                <span className={post.navTitle}>{prevPost.title}</span>
              </Link>
            </div>
          ) : (
            <div></div> // Platzhalter für Flex-Layout
          )}

          {nextPost ? (
            <div className={`${post.navLink} ${post.navLinkNext}`}>
              <Link href={`${basePath}/${nextPost.id}`}>
                <span className={post.navLabel}>Next: </span>
                <span className={post.navTitle}>{nextPost.title}</span>
              </Link>
            </div>
          ) : (
            <div></div> // Platzhalter für Flex-Layout
          )}
        </div>
      )}

      <Giscus
        id="comments"
        repo="fretchen/fretchen.github.io"
        repoId="MDEwOlJlcG9zaXRvcnkzMzkyNzQ5OA="
        category="General"
        categoryId="DIC_kwDOAgWxSs4ClveO"
        mapping="pathname"
        term="Welcome to @giscus/react component!"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="light"
        lang="en"
        loading="lazy"
      />
    </>
  );
}
