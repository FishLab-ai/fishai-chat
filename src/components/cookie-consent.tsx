'use client';

import { useState, useEffect } from 'react';
import { Fish, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const consent = localStorage.getItem('fishai-cookie-consent');
    if (!consent) {
      const showTimer = setTimeout(() => setVisible(true), 1500);
      const hideTimer = setTimeout(() => {
        localStorage.setItem('fishai-cookie-consent', 'declined');
        setVisible(false);
      }, 4500);
      return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('fishai-cookie-consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('fishai-cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) {return null;}

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[200] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0">
            <Fish className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{t.cookie.title}</h3>
          <button
            onClick={handleDecline}
            className="ml-auto h-6 w-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {t.cookie.description}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDecline}
            className="flex-1 h-9 rounded-xl text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            {t.cookie.browseOnly}
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 h-9 rounded-xl text-xs font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-[0.98]"
          >
            {t.cookie.acceptAndContinue}
          </button>
        </div>
      </div>
    </div>
  );
}