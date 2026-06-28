'use client';

import { useRef, useEffect } from 'react';
import { Brain, Globe, ArrowUp, StopCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
}

function useTextareaHeight(input: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [input]);

  return textareaRef;
}

export function ChatInput({ input, setInput, onSend, onStop, streaming }: ChatInputProps) {
  const { deepThinking, setDeepThinking, webSearch, setWebSearch } = useAppStore();
  const { t } = useI18n();
  const textareaRef = useTextareaHeight(input);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!streaming) {
        onSend();
      }
    }
  };

  return (
    <div className="px-3 pb-4 pt-3">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-700/40 shadow-lg shadow-neutral-200/30 dark:shadow-black/20 overflow-hidden">
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <button
              onClick={() => setDeepThinking(!deepThinking)}
              disabled={streaming}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                deepThinking
                  ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Brain className="w-3 h-3" />
              {t.common.deepThinking}
            </button>
            <button
              onClick={() => setWebSearch(!webSearch)}
              disabled={streaming}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                webSearch
                  ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Globe className="w-3 h-3" />
              {t.common.webSearch}
            </button>
          </div>

          <div className="flex items-end gap-2 px-3 pb-2.5 pt-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={t.chat.placeholder}
              rows={1}
              disabled={streaming}
              className="flex-1 min-h-[36px] max-h-[160px] resize-none text-sm bg-transparent text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none leading-relaxed disabled:opacity-50"
            />
            {streaming ? (
              <button
                onClick={onStop}
                className="h-8 w-8 rounded-xl bg-red-500 hover:bg-red-600 text-white shrink-0 flex items-center justify-center transition-all duration-200 active:scale-90"
                title={t.common.stopGenerating}
              >
                <StopCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={!input.trim()}
                className="h-8 w-8 rounded-xl bg-neutral-800 dark:bg-neutral-100 hover:bg-neutral-700 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shrink-0 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 active:scale-90"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="mt-1.5 text-center text-[10px] text-neutral-300 dark:text-neutral-700 select-none">
          {t.common.disclaimer}
        </p>
      </div>
    </div>
  );
}