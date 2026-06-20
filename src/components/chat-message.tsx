'use client';

import { useState } from 'react';
import { ChevronDown, Globe, Brain } from 'lucide-react';
import { Md } from '@/lib/markdown';
import type { ChatMessage } from '@/lib/store';

interface ChatMessageProps {
  msg: ChatMessage;
  isStreaming: boolean;
  streamingId: string | null;
  deepThinking?: boolean;
}

export function ChatMessageItem({ msg, isStreaming, streamingId, deepThinking = false }: ChatMessageProps) {
  const isCurrentlyStreaming = isStreaming && msg.role === 'assistant' && msg.id === streamingId;
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div
      className={`flex ${
        msg.role === 'user' ? 'justify-end' : 'justify-start'
      } animate-[fadeSlideIn_0.25s_ease-out]`}
    >
      <div
        className={`max-w-[85%] text-sm leading-relaxed ${
          msg.role === 'user'
            ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2.5 rounded-2xl rounded-br-md'
            : 'text-neutral-800 dark:text-neutral-200 px-1 py-1'
        }`}
      >
        {msg.role === 'assistant' ? (
          <>
            {msg.searchResults && (
              <div className="mb-3">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg px-2 py-1 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                >
                  <Globe className="w-3 h-3" />
                  <span>搜索结果</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      searchOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {searchOpen && (
                  <div className="mt-2 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-xs text-neutral-600 dark:text-neutral-400 max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                      {typeof msg.searchResults === 'string'
                        ? (() => {
                            try {
                              return JSON.stringify(JSON.parse(msg.searchResults), null, 2);
                            } catch {
                              return msg.searchResults;
                            }
                          })()
                        : msg.searchResults}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {msg.thinking && (
              <div className="mb-3">
                <button
                  onClick={() => setThinkingOpen(!thinkingOpen)}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors border border-amber-200/60 dark:border-amber-800/40 rounded-lg px-2 py-1 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                >
                  <Brain className="w-3 h-3" />
                  <span>思考过程</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${
                      thinkingOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {thinkingOpen && (
                  <div className="mt-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-xs text-neutral-600 dark:text-neutral-400 max-h-60 overflow-y-auto">
                    <Md text={msg.thinking} />
                  </div>
                )}
              </div>
            )}

            {isCurrentlyStreaming && deepThinking && !msg.content && !msg.thinking && (
              <div className="flex items-center gap-2 py-1 text-amber-500 dark:text-amber-400">
                <Brain className="w-4 h-4 animate-pulse" />
                <span className="text-xs">深度思考中...</span>
              </div>
            )}

            {isCurrentlyStreaming && !deepThinking && !msg.content && !msg.thinking && (
              <div className="flex items-center gap-1.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-[dotBounce_1.4s_ease-in-out_infinite]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-[dotBounce_1.4s_ease-in-out_0.2s_infinite]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-[dotBounce_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
            )}

            {!isCurrentlyStreaming && !msg.content && !msg.thinking && (
              <div className="flex items-center gap-1.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-[dotBounce_1.4s_ease-in-out_infinite]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-[dotBounce_1.4s_ease-in-out_0.2s_infinite]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-[dotBounce_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
            )}

            {msg.content && (
              <div className="prose-fishai">
                <Md text={msg.content} streaming={isCurrentlyStreaming} />
              </div>
            )}
            {isCurrentlyStreaming && msg.content && (
              <span className="inline-block w-[2px] h-[15px] bg-neutral-400 dark:bg-neutral-500 ml-0.5 align-middle rounded-full animate-[cursorBreathe_1.2s_ease-in-out_infinite]" />
            )}
          </>
        ) : (
          <span className="whitespace-pre-wrap break-words">{msg.content}</span>
        )}
      </div>
    </div>
  );
}