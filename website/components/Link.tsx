import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { css } from "../styled-system/css";

export function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const pageContext = usePageContext();
  const { urlPathname } = pageContext;
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
