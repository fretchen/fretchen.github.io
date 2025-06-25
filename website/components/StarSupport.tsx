import * as React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { useSupportAction } from "../hooks/useSupportAction";
import { starSupport } from "../layouts/styles";

interface StarSupportProps {
  variant?: "progress" | "inline";
  className?: string;
}

/**
 * StarSupport Component
 *
 * Compact star-based support button with two variants:
 * - progress: Integrated with reading progress bar (sticky top)
 * - inline: Inline content placement
 */
export default function StarSupport({ variant = "progress", className }: StarSupportProps) {
  const pageContext = usePageContext();
  const currentUrl = pageContext.urlPathname;
  
  // Reading progress state
  const [readingProgress, setReadingProgress] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  // Support functionality
  const { supportCount, isLoading, isSuccess, errorMessage, isConnected, handleSupport } = useSupportAction(currentUrl);

  // Reading progress calculation
  React.useEffect(() => {
    if (variant !== "progress") return;

    const calculateProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / docHeight) * 100, 100);
      
      setReadingProgress(progress);
      setIsVisible(progress > 5); // Show after 5% scroll
    };

    calculateProgress();
    window.addEventListener("scroll", calculateProgress);
    window.addEventListener("resize", calculateProgress);

    return () => {
      window.removeEventListener("scroll", calculateProgress);
      window.removeEventListener("resize", calculateProgress);
    };
  }, [variant]);

  // Handle support click
  const handleSupportClick = () => {
    setShowTooltip(false);
    handleSupport();
  };

  // Show tooltip on hover if there's an error
  const handleMouseEnter = () => {
    if (errorMessage) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Render star icon
  const renderStarIcon = () => {
    if (isLoading) {
      return "⏳";
    }
    if (isSuccess) {
      return <span className={`${starSupport.starIcon} ${starSupport.starIconFilled}`}>★</span>;
    }
    return <span className={starSupport.starIcon}>☆</span>;
  };

  // Render support button
  const renderSupportButton = (buttonClass: string) => (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleSupportClick}
        disabled={!isConnected || isLoading}
        className={`${buttonClass} ${isSuccess ? starSupport.supportButtonActive : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {renderStarIcon()}
        <span className={starSupport.supportCount}>{isLoading ? "..." : supportCount}</span>
      </button>
      
      {/* Tooltip for errors */}
      {showTooltip && errorMessage && <div className={starSupport.tooltip}>{errorMessage}</div>}
    </div>
  );

  // Progress variant (sticky top bar)
  if (variant === "progress") {
    return (
      <div className={`${starSupport.progressContainer} ${className || ""}`} data-visible={isVisible}>
        <div className={starSupport.progressBar}>
          <div className={starSupport.progressFill} style={{ width: `${readingProgress}%` }} />
        </div>
        
        {renderSupportButton(starSupport.supportButton)}
      </div>
    );
  }

  // Inline variant (content placement)
  return (
    <div className={`${starSupport.inlineContainer} ${className || ""}`}>
      <div className={starSupport.inlineText}>
        ⭐ Quality content? Support the creator!
        {parseInt(supportCount) > 0 && ` ${supportCount} others already did.`}
      </div>
      
      {renderSupportButton(starSupport.inlineButton)}
    </div>
  );
}
