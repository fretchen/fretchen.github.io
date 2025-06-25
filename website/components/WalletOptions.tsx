import * as React from "react";
import { useConnect, useAccount, useDisconnect, useEnsName } from "wagmi";
import { walletOptions } from "../layouts/styles";

/**
 * WalletOptions Component
 *
 * Handles wallet connection and display with unified styling.
 * Prevents hydration mismatches by waiting for client-side mount.
 *
 * @returns {JSX.Element} Dropdown menu for wallet management
 */
export default function WalletOptions() {
  // Connection hooks
  const { connectors, connect } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });

  // UI state
  const [isOpen, setIsOpen] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [buttonRect, setButtonRect] = React.useState<DOMRect | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Prevent hydration mismatch by only showing wallet data after client-side mount
  React.useEffect(() => {
    setIsMounted(true);
    
    // Check if mobile on mount and listen for resize
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Handle opening dropdown
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    // Update button position for mobile fixed positioning
    if (isMobile && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    
    setIsOpen(true);
  };

  // Handle closing dropdown with delay
  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredItem(null);
    }, 200); // 200ms delay before closing
  };

  // Display address or connect message
  const displayText =
    isMounted && isConnected
      ? ensName || (address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "")
      : isMobile
        ? "Connect"
        : "Connect Account";

  // Get menu items based on connection status
  const getMenuItems = () => {
    if (isMounted && isConnected) {
      return [{ id: "disconnect", label: "Disconnect", action: () => disconnect() }];
    } else {
      return connectors.map((connector) => ({
        id: connector.uid,
        label: connector.name,
        action: () => connect({ connector }),
      }));
    }
  };

  // Common styles
  const styles = walletOptions;

  // Mobile menu positioning
  const getMobileMenuStyle = (): React.CSSProperties => {
    if (!isMobile || !buttonRect) return {};
    
    return {
      position: "fixed",
      top: buttonRect.bottom + 4,
      right: Math.max(10, window.innerWidth - buttonRect.right),
      left: "auto",
      minWidth: "140px",
      maxWidth: "200px",
      zIndex: 3000,
    };
  };

  return (
    <div className={styles.dropdown} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button ref={buttonRef} className={styles.button}>
        {displayText}
      </button>

      {isOpen && (
        <div className={styles.menu} style={isMobile ? getMobileMenuStyle() : undefined}>
          {getMenuItems().map((item) => (
            <div
              key={item.id}
              className={`${styles.menuItem} ${hoveredItem === item.id ? styles.menuItemHover : ""}`}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => {
                item.action();
                setIsOpen(false);
                // Clear timeout when clicking to close immediately
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = null;
                }
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
