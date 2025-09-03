import React from "react";
import { css } from "../styled-system/css";

// Keep locales as a simple, editable list of strings (matching +onBeforeRoute.ts)
const LOCALES: string[] = ["de", "en"];

function getLocaleFromPathname(pathname: string): string | null {
  if (!pathname) return null;
  // normalize and split: "/de/whatever" -> ["de", "whatever"]
  const parts = pathname.replace(/^\//, "").toLowerCase().split("/");
  const candidate = parts[0] || "";
  return LOCALES.includes(candidate) ? candidate : null;
}

function stripLocalePrefix(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname;
  return pathname.replace(new RegExp(`^/${locale}`), "") || "/";
}

export default function LanguageToggle() {
  const currentPathname = typeof window !== "undefined" ? window.location.pathname : "";
  const currentLocale = getLocaleFromPathname(currentPathname) || "en";
  const otherLocale = currentLocale === "de" ? "en" : "de";

  const handleLanguageSwitch = () => {
    if (typeof window === "undefined") return;

    const pathWithoutLocale = stripLocalePrefix(currentPathname);
    const newPath = `/${otherLocale}${pathWithoutLocale}`;
    window.location.href = newPath;
  };

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
    <button
      onClick={handleLanguageSwitch}
      className={toggleStyles}
      aria-label={`Switch language to ${otherLocale.toUpperCase()}`}
      title={`Switch to ${otherLocale === "de" ? "Deutsch" : "English"}`}
    >
      <span className={currentLocale === "de" ? activeLocaleStyles : ""}>DE</span>
      <span className={css({ margin: "0 xs", color: "gray.400" })}>|</span>
      <span className={currentLocale === "en" ? activeLocaleStyles : ""}>EN</span>
    </button>
  );
}
