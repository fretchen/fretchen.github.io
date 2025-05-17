import * as React from "react";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { css } from "../styled-system/css";

/**
 * Account Component
 *
 * Displays the connected wallet address and provides a dropdown menu
 * for disconnecting. Uses ENS names when available, or shortens the
 * Ethereum address for better readability.
 *
 * @returns {JSX.Element} Dropdown menu with address and disconnect option
 */
export default function Account() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const dropdownStyle = css({
    position: "relative",
    display: "inline-block",
  });

  const buttonStyle = css({
    padding: "8px 16px",
    backgroundColor: "brand",
    color: "#ffffff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  });

  const menuStyle = css({
    position: "absolute",
    backgroundColor: "#f9f9f9",
    minWidth: "160px",
    boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
    zIndex: "1",
    right: "0",
    borderRadius: "4px",
    marginTop: "4px",
  });

  // Base menu item style without hover state
  const menuItemStyle = css({
    padding: "12px 16px",
    textDecoration: "none",
    display: "block",
    color: "black",
    textAlign: "left",
    cursor: "pointer",
    borderBottom: "1px solid #ddd",
    transition: "background-color 0.2s ease",
  });

  // Hover style as a separate class
  const menuItemHoverStyle = css({
    backgroundColor: "#e9e9e9",
  });

  // Adresse zur Anzeige formatieren
  const displayAddress =
    ensName || (address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "");

  return (
    <div className={dropdownStyle} onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className={buttonStyle}>{displayAddress}</button>

      {/* Konditionales Rendering statt display-Eigenschaft */}
      {isOpen && (
        <div className={menuStyle}>
          <div
            // Apply base style and conditionally apply hover style
            className={`${menuItemStyle} ${isHovered ? menuItemHoverStyle : ""}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => disconnect()}
          >
            Disconnect
          </div>
        </div>
      )}
    </div>
  );
}
