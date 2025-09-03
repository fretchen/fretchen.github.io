import React from "react";
import { css } from "../styled-system/css";
import { usePageContext } from "vike-react/usePageContext";
import { extractLocale } from "../locales/extractLocale";
import { locales, defaultLocale } from "../locales/locales";

export default function LanguageToggle() {
  const pageContext = usePageContext();

  // Use pageContext.urlOriginal - no window fallback needed for SSR compatibility
  const currentPathname = pageContext.urlOriginal || "";

  // Use the robust extractLocale logic from locales/extractLocale
  const { locale: currentLocale, urlPathnameWithoutLocale } = extractLocale(currentPathname);

  // Determine the other locale
  const otherLocale = currentLocale === "de" ? "en" : "de";

  // Build new path for language switch
  const newPath = `/${otherLocale}${urlPathnameWithoutLocale}`;

  const toggleStyles = css({
    display: "inline-flex",
    alignItems: "center",
    padding: "xs sm",
    fontSize: "sm",
    fontWeight: "medium",
    color: "gray.700",
    backgroundColor: "gray.100",
    border: "1px solid",
    borderColor: "gray.300",
    borderRadius: "sm",
    cursor: "pointer",
    transition: "all 0.2s",
    _hover: {
      backgroundColor: "gray.200",
      borderColor: "gray.400",
    },
    _focus: {
      outline: "2px solid",
      outlineColor: "blue.500",
      outlineOffset: "2px",
    },
  });

  const activeLocaleStyles = css({
    fontWeight: "bold",
    color: "blue.600",
  });

  return (
    <a
      href={newPath}
      className={toggleStyles}
      aria-label={`Switch language to ${otherLocale.toUpperCase()}`}
      title={`Switch to ${otherLocale === "de" ? "Deutsch" : "English"}`}
    >
      <span className={currentLocale === "de" ? activeLocaleStyles : ""}>DE</span>
      <span className={css({ margin: "0 xs", color: "gray.400" })}>|</span>
      <span className={currentLocale === "en" ? activeLocaleStyles : ""}>EN</span>
    </a>
  );
}
