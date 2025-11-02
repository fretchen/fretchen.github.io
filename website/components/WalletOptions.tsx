import * as React from "react";
import { useConnect, useAccount, useDisconnect, useEnsName } from "wagmi";
import { walletOptions } from "../layouts/styles";
import { useLocale } from "../hooks/useLocale";
import { useUmami } from "../hooks/useUmami";
import { WalletEvents } from "../utils/analytics";
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
  const { connectors, connect, error } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });

  // Analytics
  const { trackEvent } = useUmami();

  // UI state
  const [isOpen, setIsOpen] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [buttonRect, setButtonRect] = React.useState<DOMRect | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Analytics tracking refs
  const connectAttemptTime = React.useRef<number | null>(null);
  const attemptedConnector = React.useRef<string | null>(null);
  const hadInteraction = React.useRef(false);
  // Initialize with current connection state to track state transitions.
  // Success tracking is guarded by attemptedConnector check, preventing false positives
  // when component mounts with an already connected wallet.
  const wasConnected = React.useRef(isConnected);

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

  // Track connection success
  React.useEffect(() => {
    if (!wasConnected.current && isConnected && attemptedConnector.current) {
      const timeToConnect = connectAttemptTime.current ? Date.now() - connectAttemptTime.current : null;

      trackEvent(WalletEvents.CONNECT_SUCCESS, {
        connector: attemptedConnector.current,
        hasEnsName: !!ensName,
        device: isMobile ? "mobile" : "desktop",
        timeToConnect,
      });

      // Reset tracking refs
      connectAttemptTime.current = null;
      attemptedConnector.current = null;
    }

    wasConnected.current = isConnected;
  }, [isConnected, ensName, isMobile, trackEvent]);

  // Track connection errors
  React.useEffect(() => {
    if (error && attemptedConnector.current) {
      trackEvent(WalletEvents.CONNECT_ERROR, {
        connector: attemptedConnector.current,
        error: error.message,
        device: isMobile ? "mobile" : "desktop",
      });

      // Reset tracking refs
      connectAttemptTime.current = null;
      attemptedConnector.current = null;
    }
  }, [error, isMobile, trackEvent]);

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

    // Track dropdown open (only when not connected)
    if (!isConnected) {
      trackEvent(WalletEvents.DROPDOWN_OPEN, {
        device: isMobile ? "mobile" : "desktop",
      });
    }

    setIsOpen(true);
  };

  // Handle closing dropdown with delay
  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      // Track dropdown close without interaction (only when not connected)
      if (!isConnected && !hadInteraction.current) {
        trackEvent(WalletEvents.DROPDOWN_CLOSE, {
          hadInteraction: false,
          device: isMobile ? "mobile" : "desktop",
        });
      }

      setIsOpen(false);
      setHoveredItem(null);
      hadInteraction.current = false; // Reset for next open
    }, 200); // 200ms delay before closing
  };

  // Display address or connect message
  const connectLabel = useLocale({ label: "walletoptions.connect" });
  const connectAccountLabel = useLocale({ label: "walletoptions.connectAccount" });
  const displayText =
    isMounted && isConnected
      ? ensName || (address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "")
      : isMobile
        ? connectLabel
        : connectAccountLabel;

  // Get menu items based on connection status
  const disconnectLabel = useLocale({ label: "walletoptions.disconnect" });
  const getMenuItems = () => {
    if (isMounted && isConnected) {
      return [{ id: "disconnect", label: disconnectLabel, action: () => disconnect() }];
    } else {
      return connectors.map((connector) => ({
        id: connector.uid,
        label: connector.name,
        action: () => {
          // Mark that user interacted with dropdown
          hadInteraction.current = true;

          // Track connect attempt
          connectAttemptTime.current = Date.now();
          attemptedConnector.current = connector.name;

          trackEvent(WalletEvents.CONNECT_ATTEMPT, {
            connector: connector.name,
            connectorId: connector.uid,
            device: isMobile ? "mobile" : "desktop",
          });

          // Attempt connection
          connect({ connector });
        },
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
