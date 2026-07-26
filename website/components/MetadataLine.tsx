import * as React from "react";
import { useSupportAction } from "../hooks/useSupportAction";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { usePageContext } from "vike-react/usePageContext";
import { metadataLine } from "../layouts/styles";
import { useUmami } from "../hooks/useUmami";
import { useLocale } from "../hooks/useLocale";
import { SupportChainModal } from "./SupportChainModal";

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
  const {
    supportCount,
    isLoading,
    isSuccess,
    errorMessage,
    handleSupport,
    isReadPending,
    readError,
    isOnSupportedChain,
    switchToSupportedChain,
  } = useSupportAction(showSupport ? currentUrl : "");

  // Quick-connect: the same pattern used by ImageGenerator/assistant/growth
  // (hasMounted && status === "connected" — robust against SSR/hydration mismatch).
  const { isConnected, connectWallet } = useWalletConnection();

  // Guided modal shown when the wallet is on an unsupported chain (see SupportChainModal).
  // Stays open across the switch so a retried donation (see handleSwitchNetwork) can still
  // show a follow-up message (e.g. insufficient USDC balance) without the user having to
  // reopen it; only closes explicitly (user dismiss) or once a donation actually succeeds.
  const [showChainModal, setShowChainModal] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);

  // Close the modal once a donation succeeds while it's open (e.g. the retry-after-switch
  // path below). Derived at render time rather than reacting to isSuccess in an effect.
  if (showChainModal && isSuccess) {
    setShowChainModal(false);
  }

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
      // Trigger the wallet's own connect flow directly — same quick-connect pattern used
      // by ImageGenerator/assistant/growth. No custom "please connect" messaging needed.
      connectWallet("support");
      return;
    }

    // On an unsupported chain, open the guided modal instead of attempting (and silently
    // failing) the donation — explains the constraint and offers an explicit network switch.
    if (!isOnSupportedChain) {
      setShowChainModal(true);
      return;
    }

    void handleSupport();
  };

  // Tracks that the user asked to switch, so the effect below knows to retry the donation
  // once the chain actually becomes supported (wagmi's chainId updates via re-render, not
  // synchronously after switchChainAsync resolves, so this can't be done inline here).
  const [awaitingRetryAfterSwitch, setAwaitingRetryAfterSwitch] = React.useState(false);

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    setAwaitingRetryAfterSwitch(true);
    try {
      await switchToSupportedChain();
    } finally {
      setIsSwitching(false);
    }
  };

  // Once the wallet lands on a supported chain after an explicit switch request, retry the
  // donation automatically — the user shouldn't have to close the modal and click Support
  // again. If the retry still fails (e.g. no USDC on the new chain), the modal stays open
  // (see the isSuccess-close check above) and shows the resulting error/get-USDC prompt.
  // setState here is intentional: isOnSupportedChain changes asynchronously (wagmi re-render
  // after switchChainAsync resolves), so there's no synchronous alternative to reacting to it.
  React.useEffect(() => {
    if (awaitingRetryAfterSwitch && isOnSupportedChain) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAwaitingRetryAfterSwitch(false);
      void handleSupport();
    }
  }, [awaitingRetryAfterSwitch, isOnSupportedChain, handleSupport]);

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
    <>
      <div className={`${metadataLine.container} ${className || ""}`}>
        {metadataItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className={metadataLine.separator}>•</span>}
            {item}
          </React.Fragment>
        ))}
      </div>

      {showChainModal && (
        <SupportChainModal
          onClose={() => setShowChainModal(false)}
          onSwitchNetwork={handleSwitchNetwork}
          isSwitching={isSwitching}
          // Once the switch succeeded (isOnSupportedChain) but an error is still set,
          // the donation itself must have failed after switching — most likely the wallet
          // has no USDC on the new chain, so point to a way to get some.
          showGetUsdc={isOnSupportedChain && !!errorMessage}
          errorMessage={errorMessage}
        />
      )}
    </>
  );
}
