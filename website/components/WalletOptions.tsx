import * as React from "react";
import { useConnect, useAccount, useDisconnect, useEnsName } from "wagmi";
import { css } from "../styled-system/css";

/**
 * WalletOptions Component
 *
 * Handles wallet connection and display with unified styling.
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

  // Display address or connect message
  const displayText = isConnected
    ? ensName || (address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "")
    : "Connect Wallet";

  // Get menu items based on connection status
  const getMenuItems = () => {
    if (isConnected) {
      return [{ id: "disconnect", label: "Disconnect", action: () => disconnect() }];
    } else {
      return connectors.map(connector => ({
        id: connector.uid,
        label: connector.name,
        action: () => connect({ connector })
      }));
    }
  };

  // Common styles
  const styles = {
    dropdown: css({
      position: "relative",
      display: "inline-block",
    }),
    button: css({
      padding: "8px 16px",
      backgroundColor: "brand",
      color: "light",
      border: "none",
      borderRadius: "sm",
      cursor: "pointer",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "xs",
    }),
    menu: css({
      position: "absolute",
      backgroundColor: "background",
      minWidth: "160px",
      boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
      zIndex: "1",
      right: "0",
      borderRadius: "sm",
      marginTop: "xs",
    }),
    menuItem: css({
      padding: "sm",
      textDecoration: "none",
      display: "block",
      color: "text",
      textAlign: "left",
      cursor: "pointer",
      borderBottom: "1px solid token(colors.border)",
      transition: "background-color 0.2s ease",
      _last: { borderBottom: "none" },
    }),
    menuItemHover: css({
      backgroundColor: "border",
    }),
  };

  return (
    <div 
      className={styles.dropdown} 
      onMouseEnter={() => setIsOpen(true)} 
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className={styles.button}>{displayText}</button>

      {isOpen && (
        <div className={styles.menu}>
          {getMenuItems().map(item => (
            <div
              key={item.id}
              className={`${styles.menuItem} ${hoveredItem === item.id ? styles.menuItemHover : ""}`}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => {
                item.action();
                setIsOpen(false);
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
