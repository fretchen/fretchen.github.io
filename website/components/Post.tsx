import React from "react";
import { PostProps } from "../types/components";
import MetadataLine from "./MetadataLine";
import { Link } from "./Link";
import { NFTFloatImage } from "./NFTFloatImage";
import { MdxPre } from "./MdxCodeBlock";
import { post } from "./Post.styles";
import { button } from "../styled-system/recipes";
// Post modules are resolved before this component ever renders — see utils/postModuleCache.ts,
// primed by pages/+onBeforeRenderHtml.ts (server) and pages/+onBeforeRenderClient.ts (client),
// both awaited by vike-react before render/hydrate. Stufe 2, website/MDX_MIGRATION.md.
import { getPostModule, getPostModuleError } from "../utils/postModuleCache";
// KaTeX's own stylesheet — rehype-katex (vite.config.ts) renders math to real KaTeX markup
// at build time, but that markup still needs this CSS (Computer Modern @font-face rules,
// math layout) to display correctly. Lives here, not on the routes, because every prose
// route (blog and all four quantum sections) renders through this shell.
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

// Renders a post's component. By the time this mounts, +onBeforeRenderHtml.ts /
// +onBeforeRenderClient.ts have already primed postModuleCache for componentPath — read is
// synchronous, no loading state, no Suspense. `key={componentPath}` on the caller below
// forces a remount per post, so this can't go stale across post-to-post navigation.
const ReactPostRenderer: React.FC<{
  componentPath: string;
  tokenID?: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onReady?: () => void;
}> = ({ componentPath, tokenID, contentRef, onReady }) => {
  const Component = getPostModule(componentPath) as PostComponent | undefined;

  // Signals the ToC once this post's content is in the DOM. A real effect (not a call during
  // render) because render must stay pure; nothing async belongs in it anymore — the module
  // is already resolved by the time we get here.
  React.useEffect(() => {
    if (Component) onReady?.();
  }, [componentPath, Component, onReady]);

  if (!Component) {
    // Genuine failure only — primePostModule() already caught the underlying error (missing
    // module, no default export, unsupported directory) and recorded its message.
    const error = getPostModuleError(componentPath);
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
              <li>Überprüfen Sie, ob die MDX-Datei existiert</li>
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
