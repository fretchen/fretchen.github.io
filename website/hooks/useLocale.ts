import { usePageContext } from "vike-react/usePageContext";
import { defaultLocale } from "../locales/locales";
import enTranslation from "../locales/en";
import deTranslation from "../locales/de";

export function useLocale({ label, locale }: { label?: string; locale?: string }): string {
  const pageContext = usePageContext();
  const pageCtxWithLocale = pageContext as unknown as { locale?: string };
  const usedLocale = locale ?? pageCtxWithLocale.locale ?? defaultLocale;

  const translation = usedLocale === "de" ? deTranslation : enTranslation;
  const translatedLabel = (label ?? "")
    .split(".")
    .reduce((acc: unknown, key: string) => (acc as Record<string, unknown>)?.[key], translation as unknown);
  return (translatedLabel as string) || label || "";
}
