'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import zhCN, { type Translations } from './locales/zh-CN';
import enUS from './locales/en-US';
import zhTW from './locales/zh-TW';

export type Locale = 'zh-CN' | 'zh-TW' | 'en-US';

const STORAGE_KEY = 'fishai-locale';

const localeMap: Record<Locale, Translations> = {
  'zh-CN': zhCN as unknown as Translations,
  'zh-TW': zhTW as unknown as Translations,
  'en-US': enUS as unknown as Translations,
};

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'zh-CN';
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh-CN' || stored === 'zh-TW' || stored === 'en-US') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable
  }
  const browserLang = navigator.language;
  if (browserLang === 'zh-TW' || browserLang === 'zh-Hant' || browserLang === 'zh-HK') {
    return 'zh-TW';
  }
  if (browserLang && browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en-US';
}

interface I18nContextValue {
  t: Translations;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  // Persist locale to localStorage on mount
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale]);

  // Update html lang attribute when locale changes
  useEffect(() => {
    document.documentElement.lang = locale === 'en-US' ? 'en' : locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
  }, []);

  const t = localeMap[locale];

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
