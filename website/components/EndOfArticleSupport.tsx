import * as React from "react";
import { useSupportAction } from "../hooks/useSupportAction";
import { usePageContext } from "vike-react/usePageContext";
import { css } from "../styled-system/css";
import { useUmami } from "../hooks/useUmami";

/**
 * EndOfArticleSupport Component
 *
 * A prominent call-to-action at the end of blog posts.
 * Appears after the reader has consumed the content and experienced its value.
 *
 * Best practice: End-of-article CTAs have higher conversion rates because
 * the user has already received value from the content.
 */
export default function EndOfArticleSupport() {
  const { trackEvent } = useUmami();
  const pageContext = usePageContext();
  const currentUrl = pageContext.urlPathname;

  const { supportCount, isLoading, isSuccess, errorMessage, isConnected, handleSupport, isReadPending } =
    useSupportAction(currentUrl);

  const count = parseInt(supportCount) || 0;

  // Handle support click
  const handleSupportClick = (e: React.MouseEvent) => {
    e.preventDefault();

    trackEvent("blog-support-click", {
      variant: "end-of-article",
      currentSupports: count,
      isConnected: isConnected,
    });

    if (!isConnected) {
      // User needs to connect wallet first - button will show connect prompt
      return;
    }
    handleSupport();
  };

  // Handle hover for analytics
  const handleHover = () => {
    trackEvent("blog-support-button-hover", {
      variant: "end-of-article",
      currentSupports: count,
      isConnected: isConnected,
    });
  };

  // Dynamic button text
  const getButtonText = () => {
    if (isLoading) return "☕ Processing...";
    if (isSuccess) return "☕ Thank you! 🎉";
    return "☕ Buy me a coffee";
  };

  // Dynamic subtitle
  const getSubtitle = () => {
    if (isSuccess) return "Your support means a lot!";
    if (count === 0) return "Be the first to support this post!";
    if (count === 1) return "Join 1 other reader who supported this post";
    return `Join ${count} readers who supported this post`;
  };

  // Tooltip
  const getTooltip = () => {
    if (errorMessage) return errorMessage;
    if (!isConnected) return "Connect your wallet to support (~$0.50 via Optimism)";
    return "Secure donation via Optimism (~$0.50)";
  };

  if (isReadPending) {
    return null; // Don't show while loading
  }

  return (
    <div className={styles.container} onMouseEnter={handleHover}>
      <div className={styles.content}>
        <p className={styles.headline}>☕ Enjoyed this article?</p>

        <button
          onClick={handleSupportClick}
          disabled={isLoading}
          className={isSuccess ? styles.buttonSuccess : styles.button}
          title={getTooltip()}
        >
          {getButtonText()}
          {!isSuccess && <span className={styles.price}>~50¢</span>}
        </button>

        <p className={styles.subtitle}>{getSubtitle()}</p>

        {!isConnected && <p className={styles.hint}>Requires a Web3 wallet on Optimism network</p>}
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: css({
    marginTop: "xl",
    marginBottom: "lg",
    padding: "lg",
    borderRadius: "lg",
    background: "linear-gradient(135deg, #FFF5F0 0%, #FFE8DC 100%)",
    border: "1px solid #FFAB91",
    textAlign: "center",
  }),
  content: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "sm",
  }),
  headline: css({
    fontSize: "lg",
    fontWeight: "semibold",
    color: "#8B4513",
    margin: 0,
  }),
  button: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "sm",
    background: "linear-gradient(135deg, #FF6B35 0%, #FF8255 100%)",
    border: "none",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "md",
    fontWeight: "bold",
    padding: "12px 24px",
    borderRadius: "999px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(255, 107, 53, 0.3)",
    _hover: {
      transform: "scale(1.05)",
      boxShadow: "0 4px 16px rgba(255, 107, 53, 0.4)",
    },
    _disabled: {
      cursor: "wait",
      opacity: 0.8,
    },
  }),
  buttonSuccess: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "sm",
    background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
    border: "none",
    color: "white",
    cursor: "default",
    fontSize: "md",
    fontWeight: "bold",
    padding: "12px 24px",
    borderRadius: "999px",
    boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
  }),
  price: css({
    fontSize: "sm",
    opacity: 0.8,
    fontWeight: "normal",
  }),
  subtitle: css({
    fontSize: "sm",
    color: "#A0522D",
    margin: 0,
  }),
  hint: css({
    fontSize: "xs",
    color: "#CD853F",
    margin: 0,
    marginTop: "xs",
  }),
};
