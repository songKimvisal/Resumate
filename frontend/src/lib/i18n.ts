import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en.json";
import km from "../locales/km.json";

const STORAGE_KEY = "resumate-lang";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    km: { translation: km },
  },
  lng: localStorage.getItem(STORAGE_KEY) ?? "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// keep <html lang> in sync for the Khmer font CSS rules
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem(STORAGE_KEY, lng);
});

// Set on first load too
document.documentElement.lang = i18n.language;

export default i18n;
