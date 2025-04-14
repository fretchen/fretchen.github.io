import * as React from "react";
import { Connector, useConnect } from "wagmi";

import { useAccount } from "wagmi";
import Account from "./Account";

export default function WalletOptions() {
  const { connectors, connect } = useConnect();
  const [isOpen, setIsOpen] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const { isConnected } = useAccount();

  const dropdownStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "#e2e8f0",
    color: "#333333",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const menuStyle: React.CSSProperties = {
    display: isOpen ? "block" : "none",
    position: "absolute",
    backgroundColor: "#f9f9f9",
    minWidth: "160px",
    boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
    zIndex: 1,
    right: 0,
    borderRadius: "4px",
    marginTop: "4px",
  };

  const menuItemStyle = (isHovered: boolean): React.CSSProperties => ({
    padding: "12px 16px",
    textDecoration: "none",
    display: "block",
    color: "black",
    textAlign: "left",
    cursor: "pointer",
    borderBottom: "1px solid #ddd",
    backgroundColor: isHovered ? "#e9e9e9" : "transparent", // Hintergrundfarbe bei Hover
  });

  if (isConnected) return <Account />;

  return (
    <div style={dropdownStyle} onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button style={buttonStyle}>Connect Wallet</button>
      <div style={menuStyle}>
        {connectors.map((connector) => (
          <div
            key={connector.uid}
            style={menuItemStyle(hoveredItem === connector.uid)}
            onMouseEnter={() => setHoveredItem(connector.uid)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => {
              connect({ connector });
              setIsOpen(false);
            }}
          >
            {connector.name}
          </div>
        ))}
      </div>
    </div>
  );
}
