import * as React from "react";
import { useSupportAction } from "../hooks/useSupportAction";
import { usePageContext } from "vike-react/usePageContext";
import { metadataLine } from "../layouts/styles";
import { useUmami } from "../hooks/useUmami";
import { useLocale } from "../hooks/useLocale";

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

  const loadingLabel = useLocale({ label: "metadataLine.loading" });
  const supportingLabel = useLocale({ label: "metadataLine.supporting" });
  const thankYouLabel = useLocale({ label: "metadataLine.thankYou" });
  const supportLabel = useLocale({ label: "metadataLine.support" });
  const supportWithCountLabel = useLocale({ label: "metadataLine.supportWithCount" });
  const amountLabel = useLocale({ label: "metadataLine.amount" });
  const tooltipConnectLabel = useLocale({ label: "metadataLine.tooltipConnect" });
  const tooltipDonateLabel = useLocale({ label: "metadataLine.tooltipDonate" });
  const reactionLabel = useLocale({ label: "metadataLine.reaction" });
  const reactionsLabel = useLocale({ label: "metadataLine.reactions" });
  const reactionsTooltipLabel = useLocale({ label: "metadataLine.reactionsTooltip" });

  // Format publishing date — parse as local time to avoid timezone shifts
  const formatDate = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day);
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
    void handleSupport();
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
      return (
        <div className={metadataLine.supportWrapper}>
          <span className={metadataLine.supportButton} style={{ opacity: 0.7 }}>
            ☕ {loadingLabel}
          </span>
        </div>
      );
    }

    if (readError) {
      return null; // Don't show broken state
    }

    const count = parseInt(supportCount) || 0;

    // Dynamic button content based on state. In the idle state the action verb leads and
    // the amount is a visually secondary span ("☕ Support · 0.50 USDC") — standard tip-button
    // hierarchy. Transient states (loading/success) drop the amount to stay concise.
    const getButtonContent = () => {
      if (isLoading) return `☕ ${supportingLabel}`;
      if (isSuccess) return `☕ ${thankYouLabel.replace("{count}", String(count))}`;
      const label = count > 0 ? supportWithCountLabel.replace("{count}", String(count)) : supportLabel;
      return (
        <>
          ☕ {label}
          <span className={metadataLine.supportAmount}>· {amountLabel}</span>
        </>
      );
    };

    const getTooltip = () => {
      if (errorMessage) return errorMessage;
      if (!isConnected) return tooltipConnectLabel;
      return tooltipDonateLabel;
    };

    return (
      <div onMouseEnter={handleSupportHover} className={metadataLine.supportWrapper}>
        <button
          onClick={handleSupportClick}
          disabled={isLoading}
          className={metadataLine.supportButton}
          title={getTooltip()}
        >
          {getButtonContent()}
        </button>
      </div>
    );
  };

  // Render reaction count
  const renderReactionCount = () => {
    if (reactionCount === undefined || reactionCount === 0) return null;

    const reactionText = reactionCount === 1 ? reactionLabel : reactionsLabel;
    return (
      <span className={metadataLine.reactions} title={reactionsTooltipLabel}>
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
