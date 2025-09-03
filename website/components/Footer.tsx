import * as React from "react";
import { layout } from "../layouts/styles";

/**
 * Footer Component
 *
 * Displays discrete attribution and footer information
 */
const Footer: React.FC = () => {
  return (
    <footer className={layout.footer}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
        <span className={layout.footerAttribution}>by fretchen</span>
      </div>
    </footer>
  );
};

export default Footer;
