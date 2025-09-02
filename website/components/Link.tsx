import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { css } from "../styled-system/css";

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
  if (locale) {
    console.log("Locale is set to:", locale);
  }
  console.log("pageContext Link:", pageContext.locale);
  const localeDefault = "en";
  locale = locale || pageContext.locale;
  if (locale !== localeDefault) {
    href = "/" + locale + href;
  }
  const isActive = href === "/" ? urlPathname === href : urlPathname.startsWith(href);

  return (
    <a
      href={href}
      className={`${css({
        // Grundlegende Link-Styles
        color: "token(colors.primary)",

        // Active-Zustände mit PandaCSS-Bedingungen
        ...(isActive && {
          fontWeight: "token(fontWeights.bold)",
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
