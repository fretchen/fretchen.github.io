import * as React from "react";
import { useSupportAction } from "../hooks/useSupportAction";
import { usePageContext } from "vike-react/usePageContext";
import { metadataLine } from "../layouts/styles";
import { useUmami } from "../hooks/useUmami";

interface MetadataLineProps {
  publishingDate?: string;
  showSupport?: boolean;
  reactionCount?: number;
  className?: string;
}

/**
 * MetadataLine Component
 *
 * Displays content metadata in a discrete, natural way:
 * "January 15, 2025  •  💬 8 reactions  •  ☕ 12 supporters"
 *
 * Integrates support functionality seamlessly with other metadata.
 */
export default function MetadataLine({
  publishingDate,
  showSupport = false,
  reactionCount,
  className,
}: MetadataLineProps) {
  // Analytics hook
  const { trackEvent } = useUmami();

  const pageContext = usePageContext();
  const currentUrl = pageContext.urlPathname;

  // Support functionality (only load if needed)
  const { supportCount, isLoading, isSuccess, errorMessage, isConnected, handleSupport, isReadPending, readError } =
    useSupportAction(showSupport ? currentUrl : "");

  // Format publishing date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString; // Fallback to original string if parsing fails
    }
  };

  // Handle support click
  const handleSupportClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Track support click
    trackEvent("blog-support-click", {
      variant: "inline", // MetadataLine is inline variant
      currentSupports: parseInt(supportCount, 10),
      readingProgress: undefined, // No reading progress in metadata line
      isConnected: isConnected,
    });

    if (!isConnected) {
      // Could show a connect wallet message
      return;
    }
    handleSupport();
  };

  // Handle hover
  const handleSupportHover = () => {
    // Track button hover (for both connected and disconnected users)
    trackEvent("blog-support-button-hover", {
      variant: "inline",
      currentSupports: parseInt(supportCount, 10),
      readingProgress: undefined,
      isConnected: isConnected,
    });
  };

  // Render support section
  const renderSupportSection = () => {
    if (!showSupport) return null;

    if (isReadPending) {
      return "☕ Loading...";
    }

    if (readError) {
      return "☕ Error";
    }

    const count = parseInt(supportCount) || 0;
    const supportText = count === 1 ? "supporter" : "supporters";

    return (
      <div onMouseEnter={handleSupportHover} style={{ display: "inline-block" }}>
        <button
          onClick={handleSupportClick}
          disabled={isLoading || !isConnected}
          className={metadataLine.supportButton}
          title={errorMessage || (isConnected ? "Support this content" : "Connect wallet to support")}
        >
          {isLoading ? "☕ Supporting..." : isSuccess ? `★ ${count} ${supportText}` : `☕ ${count} ${supportText}`}
        </button>
      </div>
    );
  };

  // Render reaction count
  const renderReactionCount = () => {
    if (reactionCount === undefined || reactionCount === 0) return null;

    const reactionText = reactionCount === 1 ? "reaction" : "reactions";
    return (
      <span className={metadataLine.reactions} title="Likes, reposts, and replies from the web">
        💬 {reactionCount} {reactionText}
      </span>
    );
  };

  // Build metadata items
  const metadataItems = [
    publishingDate && formatDate(publishingDate),
    renderReactionCount(),
    renderSupportSection(),
  ].filter(Boolean);

  if (metadataItems.length === 0) {
    return null;
  }

  return (
    <div className={`${metadataLine.container} ${className || ""}`}>
      {metadataItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className={metadataLine.separator}>•</span>}
          {item}
        </React.Fragment>
      ))}
    </div>
  );
}
