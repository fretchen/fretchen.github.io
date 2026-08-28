import React from "react";
import { PostProps } from "../types/components";
import MetadataLine from "./MetadataLine";
import { Link } from "./Link";
import { NFTFloatImage } from "./NFTFloatImage";
import { MdxPre } from "./MdxCodeBlock";
import { post } from "./Post.styles";
import { button } from "../styled-system/recipes";
import { loadLazyModuleFromDirectory } from "../utils/lazyGlobRegistry";
import { isSupportedDirectory, getSupportedDirectories } from "../utils/supportedDirectories";
// SPIKE (Stufe 2.0, website/MDX_MIGRATION.md): see utils/postModuleCache.ts.
import { getPostModule } from "../utils/postModuleCache";
import { useKaTeXRenderer } from "../hooks/useKaTeXRenderer";
// KaTeX's own stylesheet — it carries the Computer Modern @font-face rules and the math
// layout. It lives here, not on the routes, because every prose route (blog and all four
// quantum sections) renders through this shell. Previously only /blog/@id imported it, so
// lecture math shipped KaTeX markup with no KaTeX CSS.
import "katex/dist/katex.min.css";
import { useWebmentionUrls } from "../hooks/useWebmentionUrls";
import { fetchWebmentions } from "../utils/webmentionUtils";
import { SITE } from "../utils/siteData";
import { TableOfContents } from "./TableOfContents";
import { ArticleShell } from "./ArticleShell";

import { Webmentions } from "./Webmentions";
import { CommentsSection } from "./CommentsSection";

// MDX components accept an extra `components` override prop (used to route `pre` through
// MdxPre); plain TSX posts simply ignore it.
type PostComponent = React.ComponentType<{ components?: Record<string, React.ComponentType> }>;

// Dynamic React component renderer
const ReactPostRenderer: React.FC<{
  componentPath: string;
  tokenID?: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onReady?: () => void;
}> = ({ componentPath, tokenID, contentRef, onReady }) => {
  // SPIKE (Stufe 2.0): +onBeforeRenderHtml.ts / +onBeforeRenderClient.ts prime this cache
  // before render, so on both server and client the module is often already resolved by
  // the time this component mounts — no useEffect, no Suspense, no <template> risk.
  // Read once at mount (ReactPostRenderer is remounted per componentPath via `key=` on the
  // caller below), so this can't go stale across posts.
  const [cachedComponent] = React.useState(() => getPostModule(componentPath));

  // NOTE: must be a lazy initializer (`() => ...`), not `cachedComponent ?? null` directly —
  // useState treats a bare function argument as an initializer and CALLS it, which for a
  // component function silently replaces "the component" with "the component's own render
  // output" as state. That was this spike's actual bug (Q1 diagnostic below).
  const [Component, setComponent] = React.useState<PostComponent | null>(() => cachedComponent ?? null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(!cachedComponent);

  React.useEffect(() => {
    if (cachedComponent) {
      // Already rendered synchronously above; still signal readiness for the ToC.
      onReady?.();
      return;
    }

    let cancelled = false;

    const loadComponent = async () => {
      try {
        // Extract directory and filename from componentPath
        const pathParts = componentPath.replace(/^\.\.\//, "").split("/");
        const directory = pathParts.slice(0, -1).join("/");
        const filename = pathParts[pathParts.length - 1];

        // Validate directory is supported
        if (!isSupportedDirectory(directory)) {
          throw new Error(
            `Unsupported directory: ${directory}. Supported directories: ${getSupportedDirectories().join(", ")}`,
          );
        }

        // Use centralized lazy glob registry - only fetches this post's own chunk
        const module = await loadLazyModuleFromDirectory(directory, filename);

        // The component should be the default export (works for both MDX and TSX)
        const LoadedComponent = module.default;

        if (!LoadedComponent) {
          throw new Error(`No default export found in ${filename}`);
        }

        if (cancelled) return;
        setComponent(() => LoadedComponent);
        setLoading(false);
        onReady?.();
      } catch (err) {
        if (cancelled) return;
        console.error("ReactPostRenderer: Error loading React component:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setLoading(false);
      }
    };

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [componentPath, onReady, cachedComponent]);

  // Use custom hook for KaTeX rendering
  useKaTeXRenderer(contentRef, !!Component);

  if (loading) {
    return (
      <div className={post.contentContainer}>
        <div className={post.loadingBox}>
          <p>🔄 Lade interaktive Komponente...</p>
          <p className={post.loadingPath}>
            Pfad: <code>{componentPath}</code>
          </p>
        </div>
      </div>
    );
  }

  if (error || !Component) {
    return (
      <div className={post.contentContainer}>
        <div className={post.errorBox}>
          <h3>❌ Fehler beim Laden der React-Komponente</h3>
          <p>
            <strong>Fehler:</strong> {error || "Komponente konnte nicht geladen werden"}
          </p>
          <p>
            <strong>Pfad:</strong> <code>{componentPath}</code>
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`${button({ visual: "secondary", size: "sm" })} ${post.errorSpacing}`}
          >
            🔄 Seite neu laden
          </button>
          <details className={post.errorSpacing}>
            <summary>Mögliche Lösungen</summary>
            <ul className={post.errorSpacing}>
              <li>Laden Sie die Seite neu (hilft nach einem Update der Website)</li>
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
    // e-content lives here, on the article itself, rather than on the wrapper in Post below.
    // The wrapper is always present, but the body only exists once this dynamic import has
    // resolved — so on the prerendered page the class used to describe the loading box, and
    // mf2 parsed the post's content as "🔄 Lade interaktive Komponente...Pfad: ../blog/…".
    // That string is what Bridgy Fed syndicated as the body of every post.
    <div className={`e-content ${post.contentContainer}`} ref={contentRef}>
      {tokenID && <NFTFloatImage tokenId={tokenID} />}
      <Component components={{ pre: MdxPre }} />
    </div>
  );
};

export function Post({
  title,
  publishing_date,
  prevPost,
  nextPost,
  basePath = "",
  tokenID,
  componentPath,
  description,
  category,
  secondaryCategory,
}: PostProps) {
  const { urlWithoutSlash, urlWithSlash } = useWebmentionUrls();
  const [reactionCount, setReactionCount] = React.useState<number>(0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Tracks which componentPath has finished loading. Comparing against the current
  // path (instead of a plain boolean) makes readiness flip false automatically on
  // post-to-post navigation, so the ToC rescans once the new content mounts.
  const [readyPath, setReadyPath] = React.useState<string | null>(null);
  const handleContentReady = React.useCallback(() => setReadyPath(componentPath ?? ""), [componentPath]);
  const contentReady = readyPath === (componentPath ?? "");

  // Format publishing date as ISO8601 for dt-published if available
  const isoDatetime = publishing_date ? new Date(publishing_date).toISOString().split("T")[0] : null;

  // Fetch webmention counts for metadata line - query both URL variants and deduplicate
  React.useEffect(() => {
    void fetchWebmentions(urlWithoutSlash, urlWithSlash).then(({ count }) => {
      setReactionCount(count);
    });
  }, [urlWithoutSlash, urlWithSlash]);

  return (
    <article className="h-entry">
      {/* Hidden microformat metadata */}
      {publishing_date && (
        <time className="dt-published" dateTime={isoDatetime || undefined} style={{ display: "none" }}>
          {publishing_date}
        </time>
      )}
      <a rel="author" className="p-author h-card" href="https://www.fretchen.eu/" style={{ display: "none" }}>
        {SITE.name}
      </a>
      <a className="u-url" href={urlWithoutSlash} style={{ display: "none" }}>
        {urlWithoutSlash}
      </a>
      {description && (
        <div className="p-summary" style={{ display: "none" }}>
          {description}
        </div>
      )}
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
      <a className="u-bridgy-fed" href="https://fed.brid.gy/" hidden={true} style={{ display: "none" }} />
      <a className="u-bridgy-omit-link" href="https://brid.gy/publish/mastodon" style={{ display: "none" }} />
      <a className="u-bridgy-omit-link" href="https://brid.gy/publish/bluesky" style={{ display: "none" }} />

      <ArticleShell
        header={
          <>
            <h1 className={`p-name ${post.title}`}>{title}</h1>
            <MetadataLine publishingDate={publishing_date} showSupport={true} reactionCount={reactionCount} />
          </>
        }
        toc={<TableOfContents contentRef={contentRef} isReady={contentReady} />}
      >
        {/* Render based on post type */}
        {/* Carries the ref the ToC and KaTeX scan. Deliberately no e-content: that class
            belongs to the rendered article, which ReactPostRenderer adds once it exists. */}
        <div ref={contentRef}>
          <ReactPostRenderer
            key={componentPath}
            componentPath={componentPath ?? ""}
            tokenID={tokenID}
            contentRef={contentRef}
            onReady={handleContentReady}
          />
        </div>

        {/* Navigation zwischen Posts */}
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
              <div></div>
            )}

            {nextPost ? (
              <div className={`${post.navLink} ${post.navLinkNext}`}>
                <Link href={`${basePath}/${nextPost.id}`}>
                  <span className={post.navLabel}>Next: </span>
                  <span className={post.navTitle}>{nextPost.title}</span>
                </Link>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        )}

        <Webmentions />
        <CommentsSection />
      </ArticleShell>
    </article>
  );
}
