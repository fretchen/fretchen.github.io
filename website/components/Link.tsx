import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { css } from "../styled-system/css";

import { defaultLocale } from "../locales/locales";

export function Link({
  href,
  children,
  locale,
  className,
}: {
  href: string;
  children: React.ReactNode;
  locale?: string;
  className?: string;
}) {
  const pageContext = usePageContext();
  const { urlPathname } = pageContext;

  if (!locale && pageContext.locale) {
    locale = pageContext.locale;
  }
  if (!locale && !pageContext.locale) {
    locale = defaultLocale;
  }

  // Ensure trailing slash for internal page links (not files, hashes, or queries)
  if (!href.endsWith("/") && !href.includes(".") && !href.includes("#") && !href.includes("?")) {
    href += "/";
  }

  // Only add locale prefix for non-default locale
  if (locale !== defaultLocale) {
    href = "/" + locale + href;
  }
  const isActive = href === "/" ? urlPathname === href : urlPathname.startsWith(href);

  return (
    <a
      href={href}
      className={`${css({
        // No colour here on purpose: this primitive wraps both nav items and whole
        // cards (see Card.tsx / EntryList.tsx), so a colour would tint card content.
        // Callers that want a link colour set it themselves.

        // Active-Zustände mit PandaCSS-Bedingungen
        ...(isActive && {
          fontWeight: "bold",
        }),

        // Hover-Zustände
        _hover: {
          backgroundColor: isActive ? "token(colors.border)" : "token(colors.background)",
        },
      })} ${className || ""}`}
    >
      {children}
    </a>
  );
}
