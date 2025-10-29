import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { PostProps } from "../types/components";
import MetadataLine from "./MetadataLine";
import { Link } from "./Link";
import { NFTFloatImage } from "./NFTFloatImage";
import { post, titleBar } from "../layouts/styles";
import "katex/dist/katex.min.css";
import { loadModuleFromDirectory, isSupportedDirectory } from "../utils/globRegistry";
import { usePageContext } from "vike-react/usePageContext";
import { useKaTeXRenderer } from "../hooks/useKaTeXRenderer";
import { SITE } from "../utils/siteData";

import { Webmentions } from "./Webmentions";

// Dynamic React component renderer
const ReactPostRenderer: React.FC<{ componentPath: string; tokenID?: number }> = ({ componentPath, tokenID }) => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const componentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadComponent = async () => {
      try {
        // Extract directory and filename from componentPath
        const pathParts = componentPath.replace(/^\.\.\//, "").split("/");
        const directory = pathParts.slice(0, -1).join("/");
        const filename = pathParts[pathParts.length - 1];

        // Validate directory is supported
        if (!isSupportedDirectory(directory)) {
          throw new Error(
            `Unsupported directory: ${directory}. Supported directories: blog, quantum/amo, quantum/basics, quantum/hardware, quantum/qml`,
          );
        }

        // Use centralized glob registry - automatically handles production vs development
        const module = await loadModuleFromDirectory(directory, filename, import.meta.env.PROD);

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

  // Use custom hook for KaTeX rendering
  useKaTeXRenderer(componentRef, !!Component);

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
    <div className={post.contentContainer} ref={componentRef}>
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

export function Post({
  title,
  content,
  publishing_date,
  prevPost,
  nextPost,
  basePath = "",
  tokenID,
  type = "markdown",
  componentPath,
  description,
  category,
  secondaryCategory,
}: PostProps) {
  const pageContext = usePageContext();
  const fullUrl = `https://www.fretchen.eu${pageContext.urlPathname}/`;
  const [reactionCount, setReactionCount] = React.useState<number>(0);

  // Format publishing date as ISO8601 for dt-published if available
  const isoDatetime = publishing_date ? new Date(publishing_date).toISOString().split("T")[0] : null;

  // Fetch webmention counts for metadata line
  React.useEffect(() => {
    fetch(`https://webmention.io/api/mentions.jf2?target=${fullUrl}`)
      .then((response) => response.json())
      .then((data) => {
        const count = data.children?.length || 0;
        setReactionCount(count);
      })
      .catch(() => setReactionCount(0));
  }, [fullUrl]);

  return (
    <article className="h-entry">
      <h1 className={`p-name ${titleBar.title}`}>{title}</h1>

      {/* dt-published hidden - displayed in MetadataLine instead (visible date shown below) */}
      {publishing_date && (
        <time className="dt-published" dateTime={isoDatetime || undefined} style={{ display: "none" }}>
          {publishing_date}
        </time>
      )}

      {/* p-author h-card - links to site's h-card for author identification */}
      <a rel="author" className="p-author h-card" href="https://www.fretchen.eu/" style={{ display: "none" }}>
        {SITE.name}
      </a>

      {/* u-url - canonical URL for the entry */}
      <a className="u-url" href={fullUrl} style={{ display: "none" }}>
        {fullUrl}
      </a>

      {/* Hidden p-summary for h-entry microformat (used by Bridgy Fed & parsers) */}
      {description && (
        <div className="p-summary" style={{ display: "none" }}>
          {description}
        </div>
      )}

      {/* Hidden p-category for h-entry microformat (tags/categories) */}
      {category && (
        <a href="" className="p-category" style={{ display: "none" }}>
          {category}
        </a>
      )}
      {secondaryCategory && (
        <a href="" className="p-category" style={{ display: "none" }}>
          {secondaryCategory}
        </a>
      )}

      {/* Hidden Bridgy Fed link - triggers automatic post discovery and bridging */}
      <a className="u-bridgy-fed" href="https://fed.brid.gy/" hidden={true} style={{ display: "none" }} />

      <MetadataLine publishingDate={publishing_date} showSupport={true} reactionCount={reactionCount} />

      {/* Render based on post type */}
      {type === "react" && componentPath ? (
        <div className="e-content">
          <ReactPostRenderer componentPath={componentPath} tokenID={tokenID} />
        </div>
      ) : (
        <div className={`e-content ${post.contentContainer}`}>
          {tokenID && <NFTFloatImage tokenId={tokenID} />}
          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {content}
          </Markdown>
        </div>
      )}

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

      <Webmentions postUrl={fullUrl} />
    </article>
  );
}
