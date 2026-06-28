'use client';

import { Globe, Check } from 'lucide-react';
import { useI18n, type Locale } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LOCALE_OPTIONS: { key: Locale; label: string }[] = [
  { key: 'zh-CN', label: '简体中文' },
  { key: 'zh-TW', label: '繁體中文' },
  { key: 'en-US', label: 'English' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const currentLabel = LOCALE_OPTIONS.find((o) => o.key === locale)?.label ?? locale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white/70 dark:bg-neutral-800/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-700/30 text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300/50 dark:hover:border-emerald-600/30 transition-all duration-200 text-xs font-medium cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{currentLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-36">
        {LOCALE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onClick={() => setLocale(opt.key)}
            className="cursor-pointer"
          >
            <span className="flex-1">{opt.label}</span>
            {locale === opt.key && <Check className="w-3.5 h-3.5 text-emerald-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}