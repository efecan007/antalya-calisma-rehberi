import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext(null);

const SUPPORTED = ['tr', 'en'];
const DEFAULT_LANG = 'tr';

function getInitialLang() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('lang');
    if (saved && SUPPORTED.includes(saved)) return saved;
  }
  return DEFAULT_LANG;
}

function lookup(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setLang = useCallback((next) => {
    if (SUPPORTED.includes(next)) setLangState(next);
  }, []);

  // t(key, vars): anahtarı aktif dilde çözer; yoksa TR'ye, o da yoksa anahtarın
  // kendisine düşer. {isim} yer tutucuları vars ile doldurulur.
  const t = useCallback(
    (key, vars) => {
      let str = lookup(translations[lang], key);
      if (str == null) str = lookup(translations[DEFAULT_LANG], key);
      if (str == null) return key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
