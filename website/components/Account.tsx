import * as React from "react";
import { useAccount, useDisconnect, useEnsName } from "wagmi";

export default function Account() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const dropdownStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "#4a4a4a",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "8px",
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

  const menuItemStyle = (hovered: boolean): React.CSSProperties => ({
    padding: "12px 16px",
    textDecoration: "none",
    display: "block",
    color: "black",
    textAlign: "left",
    cursor: "pointer",
    borderBottom: "1px solid #ddd",
    backgroundColor: hovered ? "#e9e9e9" : "transparent",
    transition: "background-color 0.2s ease",
  });

  // Adresse zur Anzeige formatieren
  const displayAddress =
    ensName || (address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "");

  return (
    <div style={dropdownStyle} onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button style={buttonStyle}>{displayAddress}</button>
      <div style={menuStyle}>
        <div
          style={menuItemStyle(isHovered)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => disconnect()}
        >
          Disconnect
        </div>
      </div>
    </div>
  );
}
