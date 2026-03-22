import * as React from "react";
import { useSupportAction } from "../hooks/useSupportAction";
import { usePageContext } from "vike-react/usePageContext";
import { compactSupport } from "../layouts/styles";
import { useUmami } from "../hooks/useUmami";

export function CompactSupport() {
  const { trackEvent } = useUmami();
  const pageContext = usePageContext();
  const currentUrl = pageContext.urlPathname;

  const { supportCount, isLoading, isSuccess, errorMessage, isConnected, handleSupport, isReadPending } =
    useSupportAction(currentUrl);

  const count = parseInt(supportCount) || 0;

  const handleSupportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    trackEvent("blog-support-click", {
      variant: "compact",
      currentSupports: count,
      isConnected: isConnected,
    });
    if (!isConnected) return;
    handleSupport();
  };

  const handleHover = () => {
    trackEvent("blog-support-button-hover", {
      variant: "compact",
      currentSupports: count,
      isConnected: isConnected,
    });
  };

  const getButtonText = () => {
    if (isLoading) return "☕ Processing...";
    if (isSuccess) return "☕ Thank you! 🎉";
    return "☕ Support ~50¢";
  };

  const getTooltip = () => {
    if (errorMessage) return errorMessage;
    if (!isConnected) return "Connect wallet to support (~$0.50 via Optimism)";
    return "Secure donation via Optimism (~$0.50)";
  };

  if (isReadPending) return null;

  return (
    <div className={compactSupport.container} onMouseEnter={handleHover}>
      <span className={compactSupport.text}>Enjoyed this article?</span>
      <button
        onClick={handleSupportClick}
        disabled={isLoading}
        className={compactSupport.button}
        title={getTooltip()}
      >
        {getButtonText()}
      </button>
      {count > 0 && <span className={compactSupport.count}>· {count} supporters</span>}
    </div>
  );
}
