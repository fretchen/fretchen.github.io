import React from "react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { PostProps } from "../types/components";
import TitleBar from "./TitleBar";
import { Link } from "./Link";
import { NFTFloatImage } from "./NFTFloatImage";
import { post } from "../layouts/styles";
import "katex/dist/katex.min.css";

import Giscus from "@giscus/react";

// Dynamic React component renderer
const ReactPostRenderer: React.FC<{ componentPath: string }> = ({ componentPath }) => {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    // For demonstration purposes, we'll render the interactive example directly
    // In a production environment, you might want to use dynamic imports or a component registry
    
    // Extract the component name from the path
    const componentName = componentPath.split("/").pop()?.replace(".tsx", "");
    
    if (componentName === "interactive_example") {
      // For now, we'll render a placeholder that simulates the interactive component
      setComponent(() => {
        // Import the actual component here - for now using a placeholder
        return React.lazy(() =>
          Promise.resolve({
            default: () => {
              // This is a simplified version - in production you'd dynamically import the actual component
              return (
                <div className={post.contentContainer}>
                  <div
                    style={{
                      border: "2px solid #007acc",
                      borderRadius: "8px",
                      padding: "20px",
                      margin: "20px 0",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <h2>🎉 TypeScript Post erfolgreich geladen!</h2>
                    <p>
                      Dies ist ein Beweis, dass TypeScript-basierte Blog-Posts funktionieren! Die Post-Komponente hat
                      erfolgreich erkannt, dass dies ein React-Post ist und lädt entsprechend diese spezielle
                      Renderer-Komponente.
                    </p>
                    <div
                      style={{
                        backgroundColor: "#e3f2fd",
                        padding: "15px",
                        borderLeft: "4px solid #2196f3",
                        marginTop: "15px",
                      }}
                    >
                      <strong>Komponenten-Details:</strong>
                      <ul>
                        <li>
                          Pfad: <code>{componentPath}</code>
                        </li>
                        <li>Typ: React Component (.tsx)</li>
                        <li>Status: Erfolgreich geladen</li>
                      </ul>
                    </div>
                    <p style={{ marginTop: "15px", fontStyle: "italic", color: "#666" }}>
                      In der finalen Implementierung würde hier die tatsächliche interaktive Komponente mit Calculator,
                      Charts und allen interaktiven Features geladen werden.
                    </p>
                  </div>
                </div>
              );
            },
          }),
        );
      });
      setLoading(false);
    } else {
      setError(`Unknown React component: ${componentName}`);
      setLoading(false);
    }
  }, [componentPath]);

  if (loading) {
    return (
      <div className={post.contentContainer}>
        <p>Lade interaktive Komponente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={post.contentContainer}>
        <div
          style={{
            border: "1px solid #dc3545",
            borderRadius: "4px",
            padding: "15px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
          }}
        >
          <strong>Fehler beim Laden der React-Komponente:</strong>
          <p>{error}</p>
          <p>Pfad: {componentPath}</p>
        </div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className={post.contentContainer}>
        <p>Komponente konnte nicht geladen werden.</p>
      </div>
    );
  }

  return (
    <div className={post.contentContainer}>
      <React.Suspense fallback={<div>Lade...</div>}>
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
}: PostProps) {
  console.log("Post component rendering with props:", { title, tokenID, publishing_date, type });

  if (tokenID) {
    console.log("Rendering NFTHeroCard with tokenID:", tokenID);
  } else {
    console.log("No tokenID provided, skipping NFTHeroCard");
  }

  return (
    <>
      <TitleBar title={title} />
      {publishing_date && <p className={post.publishingDate}>Published on: {publishing_date}</p>}

      {/* Render based on post type */}
      {type === "react" && componentPath ? (
        <ReactPostRenderer componentPath={componentPath} />
      ) : (
        <div className={post.contentContainer}>
          {tokenID && <NFTFloatImage tokenId={tokenID} />}
          <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
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
