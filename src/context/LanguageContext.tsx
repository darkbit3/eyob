import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from '../data/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('bidlow_lang');
    return (saved === 'am' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('bidlow_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(newLang: Language) {
    setLangState(newLang);
  }

  function t(key: keyof typeof translations['en']): string {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || String(key);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
