'use client';

import { useState, useEffect } from 'react';
import { Fish, X } from 'lucide-react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('fishai-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
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
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">隐私与 Cookie</h3>
          <button
            onClick={handleDecline}
            className="ml-auto h-6 w-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          我们使用本地存储（Cookie 和 localStorage）来记住你的登录状态、主题偏好和对话历史。
          这些数据仅保存在你的浏览器中，不会上传至第三方。继续使用即表示你同意我们的数据存储方式。
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDecline}
            className="flex-1 h-9 rounded-xl text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            仅浏览
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 h-9 rounded-xl text-xs font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-[0.98]"
          >
            同意并继续
          </button>
        </div>
      </div>
    </div>
  );
}