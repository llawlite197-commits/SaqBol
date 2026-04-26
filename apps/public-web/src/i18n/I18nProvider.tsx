"use client";

import {
  createContext,
  ReactNode,
  useEffect,
  useMemo,
  useState
} from "react";
import { Language, translations, TranslationKey } from "./translations";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

const storageKey = "saqbol.public.language";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (saved === "ru" || saved === "kz") {
      setLanguageState(saved);
    }
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    localStorage.setItem(storageKey, nextLanguage);
  }

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      setLanguage,
      t: (key) => translations[language][key] ?? translations.ru[key] ?? key
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}