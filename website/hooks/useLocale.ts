import { usePageContext } from "vike-react/usePageContext";
import { getProperty } from "dot-prop";
import { defaultLocale } from "../locales/locales";
import enTranslation from "../locales/en";
import deTranslation from "../locales/de";

export function useLocale({ label, locale }: { label?: string; locale?: string }): string {
  const pageContext = usePageContext();
  const pageCtxWithLocale = pageContext as unknown as { locale?: string };
  const usedLocale = locale ?? pageCtxWithLocale.locale ?? defaultLocale;

  // Fallback auf Übersetzungen
  const translation = usedLocale === "de" ? deTranslation : enTranslation;
  const translatedLabel = getProperty(translation, label);
  return translatedLabel || label || "";
}
