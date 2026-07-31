import React from "react";
import { css } from "../styled-system/css";
import { usePageContext } from "vike-react/usePageContext";
import { extractLocale } from "../locales/extractLocale";
import { getPageUrl } from "../utils/pageContext";

export default function LanguageToggle() {
  const pageContext = usePageContext();

  // Get current pathname in a consistent way
  const currentPathname = getPageUrl(pageContext);

  // Use the robust extractLocale logic from locales/extractLocale
  const { locale: currentLocale, urlPathnameWithoutLocale } = extractLocale(currentPathname);

  // Build paths for both languages - ensure proper path formatting
  const dePath = urlPathnameWithoutLocale === "/" ? "/de" : `/de${urlPathnameWithoutLocale}`;
  const enPath = urlPathnameWithoutLocale; // English uses root path (no /en/ prefix)

  const containerStyles = css({
    display: "flex",
    alignItems: "center",
    gap: "0.5",
    padding: "1",
    backgroundColor: "gray.100",
    borderRadius: "md",
    fontSize: "xs",
    fontWeight: "semibold",
  });

  const pillStyles = css({
    padding: "4px 8px",
    borderRadius: "sm",
    textDecoration: "none",
    transition: "all {durations.normal} ease",
    fontSize: "xs",
    fontWeight: "semibold",
    "&:hover": {
      backgroundColor: "gray.200",
    },
    "&:focus": {
      outline: "2px solid",
      outlineColor: "blue.500",
      outlineOffset: "1px",
    },
  });

  const activePillStyles = css({
    backgroundColor: "white",
    color: "gray.900",
    fontWeight: "semibold",
    boxShadow: "sm",
  });

  const inactivePillStyles = css({
    color: "gray.600",
  });

  return (
    <div className={containerStyles} role="group" aria-label="Language selection">
      <a
        href={dePath}
        className={`${pillStyles} ${currentLocale === "de" ? activePillStyles : inactivePillStyles}`}
        aria-label="Switch to German"
        aria-current={currentLocale === "de" ? "page" : undefined}
      >
        DE
      </a>
      <a
        href={enPath}
        className={`${pillStyles} ${currentLocale === "en" ? activePillStyles : inactivePillStyles}`}
        aria-label="Switch to English"
        aria-current={currentLocale === "en" ? "page" : undefined}
      >
        EN
      </a>
    </div>
  );
}
