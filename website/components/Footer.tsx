import * as React from "react";
import { layout } from "../layouts/styles";
import { SITE, getSocialLinks } from "../utils/siteData";

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
  const socialLinks = getSocialLinks();

  return (
    <footer className={layout.footer}>
      <div className={layout.footerContent}>
        <div className={`h-card ${layout.hcard}`} data-about={SITE.url}>
          {/* h-card: Photo (u-photo) - hidden but part of h-card for parsers */}
          <img src={SITE.photo} alt={SITE.name} className={`u-photo ${layout.hcardPhoto}`} />

          {/* h-card: Main name/URL */}
          <div className={layout.hcardName}>
            <a href={SITE.url} className={`p-name u-url ${layout.hcardNameLink}`} title={`${SITE.name}'s homepage`}>
              {SITE.name}
            </a>
          </div>

          {/* Separator */}
          <span aria-hidden="true">•</span>

          {/* h-card: Social links with rel="me" for identity verification */}
          <div className={layout.hcardLinks}>
            {socialLinks.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                className={layout.hcardLink}
                rel="me"
                title={`Follow on ${social.label}`}
              >
                <span>{social.icon}</span>
                <span>{social.label}</span>
              </a>
            ))}
          </div>

          {/* Separator */}
          <span aria-hidden="true">•</span>

          {/* Attribution */}
          <div className={layout.footerAttribution}>
            © {currentYear} {SITE.name}
          </div>

          {/* Biography/Note - only visible on mobile */}
          <p className={`p-note ${layout.hcardNote}`}>{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
