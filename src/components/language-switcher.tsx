'use client';

import { Globe } from 'lucide-react';
import { useI18n, type Locale } from '@/lib/i18n';

const LOCALE_CYCLE: Locale[] = ['zh-CN', 'zh-TW', 'en-US'];

const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '简体',
  'zh-TW': '繁體',
  'en-US': 'EN',
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const handleToggle = () => {
    const idx = LOCALE_CYCLE.indexOf(locale);
    const next = idx >= 0
      ? LOCALE_CYCLE[(idx + 1) % LOCALE_CYCLE.length]
      : LOCALE_CYCLE[0];
    if (next) {
      setLocale(next);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-200 border border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
      title={LOCALE_LABELS[locale]}
    >
      <Globe className="w-3 h-3" />
      <span>{LOCALE_LABELS[locale]}</span>
    </button>
  );
}
