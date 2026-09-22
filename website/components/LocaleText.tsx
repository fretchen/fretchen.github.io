import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { defaultLocale } from "../locales/locales";
import enTranslation from "../locales/en";
import deTranslation from "../locales/de";

export function LocaleText({ label, locale }: { label?: string; locale?: string }) {
  const pageContext = usePageContext();
  const pageCtxWithLocale = pageContext as unknown as { locale?: string };
  const usedLocale = locale ?? pageCtxWithLocale.locale ?? defaultLocale;

  const translation = usedLocale === "de" ? deTranslation : enTranslation;
  const translatedLabel = (label ?? "")
    .split(".")
    .reduce((acc: unknown, key: string) => (acc as Record<string, unknown>)?.[key], translation as unknown);
  // Falls back to the label itself, as `useLocale` does. The two are meant to be the hook and
  // the component form of one lookup, and without this an unresolvable key renders nothing at
  // all — invisible rather than obviously wrong. Callers that pass a literal instead of a key
  // (test fixtures, and anything not yet localised) therefore still render it.
  return <span data-locale={usedLocale}>{(translatedLabel as string) || label}</span>;
}
