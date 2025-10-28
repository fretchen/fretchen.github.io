import * as React from "react";
import { layout } from "../layouts/styles";

/**
 * Footer Component with h-card for Bridgy Fed compatibility
 *
 * Implements microformats2 h-card standard for IndieWeb interoperability
 * References: https://microformats.org/wiki/h-card, https://fed.brid.gy/
 *
 * Desktop: Compact horizontal layout
 * Mobile: Stacked vertical layout
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const siteUrl = "https://fretchen.dev";

  return (
    <footer className={layout.footer}>
      <div className={layout.footerContent}>
        <div className={layout.hcard} data-about={siteUrl}>
          {/* h-card: Main name/URL */}
          <div className={layout.hcardName}>
            <a href={siteUrl} className={layout.hcardNameLink} title="fretchen's homepage">
              fretchen
            </a>
          </div>

          {/* Separator */}
          <span aria-hidden="true">•</span>

          {/* h-card: Social links with rel="me" for identity verification */}
          <div className={layout.hcardLinks}>
            <a
              href="https://mastodon.social/@fretchen"
              className={layout.hcardLink}
              rel="me"
              title="Follow on Mastodon"
            >
              <span>🐘</span>
              <span>Mastodon</span>
            </a>
            <a href="https://github.com/fretchen" className={layout.hcardLink} rel="me" title="GitHub profile">
              <span>💻</span>
              <span>GitHub</span>
            </a>
            <a
              href="https://bsky.app/profile/fretchen.bsky.social"
              className={layout.hcardLink}
              rel="me"
              title="Bluesky profile"
            >
              <span>🦋</span>
              <span>Bluesky</span>
            </a>
          </div>

          {/* Separator */}
          <span aria-hidden="true">•</span>

          {/* Attribution */}
          <div className={layout.footerAttribution}>© {currentYear} fretchen</div>

          {/* Biography/Note - only visible on mobile */}
          <p className={layout.hcardNote}>Exploring Web3, Quantum Mechanics & Decentralized Technologies</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
