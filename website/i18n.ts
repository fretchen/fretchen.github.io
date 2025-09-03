import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files directly
import enTranslations from "./locales/en";
import deTranslations from "./locales/de";

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: { translation: enTranslations },
    de: { translation: deTranslations },
  },
});

export default i18n;
