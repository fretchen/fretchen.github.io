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
      <span className={layout.footerAttribution}>by fretchen</span>
    </footer>
  );
};

export default Footer;
