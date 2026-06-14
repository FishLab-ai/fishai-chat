'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send, Github, ArrowRight, X, Code2, Pencil, Sparkles, Fish,
  Sun, Moon, ArrowDown,
} from 'lucide-react';

// ────── Types ──────
interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ────── Markdown 渲染 ──────
function Md({ text, animate = false, prevLen = 0 }: { text: string; animate?: boolean; prevLen?: number }) {
  // 将文本分为 "旧段" 和 "新段"
  // 新段 = 从 prevLen 开始到末尾，用 span 包裹加淡入
  const renderSegment = (seg: string, startOffset: number) => {
    if (!animate || startOffset >= prevLen) {
      // 全部是新的，整体淡入
      return <span className={animate ? 'animate-[charFadeIn_0.3s_ease-out_both]' : ''}>{seg}</span>;
    }
    const cut = prevLen - startOffset;
    if (cut >= seg.length) {
      // 全部是旧的
      return <span>{seg}</span>;
    }
    // 部分旧部分新
    return (
      <>
        <span>{seg.slice(0, cut)}</span>
        <span className="animate-[charFadeIn_0.3s_ease-out_both]">{seg.slice(cut)}</span>
      </>
    );
  };

  let globalOffset = 0;

  const blocks = text.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {blocks.map((block, i) => {
        const blockStart = globalOffset;
        globalOffset += block.length;

        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.slice(3, -3).split('\n');
          const lang = /^[a-z]/i.test(lines[0]) ? lines[0] : '';
          const code = lines.slice(lang ? 1 : 0).join('\n');
          return (
            <div key={i} className="my-2.5 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700/60">
              {lang && (
                <div className="bg-neutral-50 dark:bg-neutral-800/80 px-3 py-1 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 border-b border-neutral-200 dark:border-neutral-700/60">
                  <Code2 className="w-3 h-3" />{lang}
                </div>
              )}
              <pre className="bg-white dark:bg-neutral-900/60 p-3 overflow-x-auto text-[13px] leading-relaxed font-mono text-neutral-700 dark:text-neutral-300">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const segs = block.split(/(`[^`\n]+`)/g);
        return (
          <span key={i}>
            {segs.map((s, j) => {
              const segStart = blockStart + block.indexOf(s);
              if (s.startsWith('`') && s.endsWith('`')) {
                const inner = s.slice(1, -1);
                return <code key={j} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-1 py-0.5 rounded text-[13px] font-mono">{inner}</code>;
              }
              const bs = s.split(/(\*\*[^*]+\*\*)/g);
              return bs.map((b, k) => {
                const partStart = segStart + s.indexOf(b);
                if (b.startsWith('**') && b.endsWith('**'))
                  return <strong key={`${j}-${k}`} className="font-semibold">{renderSegment(b.slice(2, -2), partStart)}</strong>;
                return <span key={`${j}-${k}`}>{renderSegment(b, partStart)}</span>;
              });
            })}
          </span>
        );
      })}
    </>
  );
}

// ────── 主题 Hook ──────
function useTheme() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fishai-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    setDark(isDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('fishai-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('fishai-theme', 'light');
    }
  }, [dark, mounted]);

  return [dark, setDark] as const;
}

// ────── 介绍页 ──────
function Landing({ onStart, dark, setDark }: { onStart: () => void; dark: boolean; setDark: (d: boolean) => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 transition-colors duration-300">
      <header className="h-14 flex items-center justify-between px-6 border-b border-neutral-100 dark:border-neutral-800/60">
        <div className="flex items-center gap-2.5">
          <Fish className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-[15px] tracking-tight text-neutral-900 dark:text-neutral-100">FishAI</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDark(!dark)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a href="https://github.com/FishLab-ai" target="_blank" rel="noopener noreferrer">
            <button className="h-8 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Github className="w-4 h-4" /> GitHub
            </button>
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
            <Fish className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">FishAI</h1>

          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
            FishLab-ai 自研 AI 助手，小体积最聪明。<br />
            RoPE + SwiGLU + RMSNorm + GQA + 混合精度量化。<br />
            能写代码、写文章、深度推理、回答问题。
          </p>

          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-300 dark:text-neutral-600">
            <span>Rust</span><span>·</span>
            <span>LLaMA-style v2</span><span>·</span>
            <span>No Git LFS</span>
          </div>

          <button
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 h-11 text-sm font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg"
          >
            开始聊天 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <footer className="h-12 flex items-center justify-center text-[11px] text-neutral-300 dark:text-neutral-700">
        FishLab-ai
      </footer>
    </div>
  );
}

// ────── 聊天页 ──────
function Chat({ onBack, dark, setDark }: { onBack: () => void; dark: boolean; setDark: (d: boolean) => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const convId = useRef(`c_${Date.now()}`);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 追踪上次渲染长度，用于增量动画
  const prevLenRef = useRef<Record<string, number>>({});

  // 滚动控制
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const userScrolledUp = useRef(false);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 80;
    userScrolledUp.current = !isNearBottom;
    setShowScrollBtn(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    chatEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // 新消息时：如果用户在底部就跟随，否则不强制
  useEffect(() => {
    if (!userScrolledUp.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // textarea 自适应
  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }
  }, [input]);

  // 流式发送
  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;

    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: 'user', content };
    const aid = `a_${Date.now()}`;
    setMessages(prev => [...prev, userMsg, { id: aid, role: 'assistant', content: '' }]);
    prevLenRef.current[aid] = 0;
    setInput('');
    setStreaming(true);
    // 发送后自动滚到底部
    userScrolledUp.current = false;
    setTimeout(() => scrollToBottom(), 50);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId: convId.current }),
      });
      if (!res.ok) throw new Error('请求失败');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无响应流');

      const dec = new TextDecoder();
      let buf = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const obj = JSON.parse(data);
            if (obj.content) {
              full += obj.content;
              const current = full;
              // SSE 到了就显示，不限速
              setMessages(prev => {
                const idx = prev.findIndex(m => m.id === aid);
                if (idx === -1) return prev;
                const updated = [...prev];
                updated[idx] = { ...prev[idx], content: current };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aid ? { ...m, content: '出了点问题，请重试。' } : m
      ));
    } finally {
      setStreaming(false);
      delete prevLenRef.current[aid];
    }
  }, [streaming, scrollToBottom]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const suggestions = [
    { icon: Code2, label: '写代码', prompt: '用 Rust 实现一个 LRU Cache，支持 get 和 put 操作，并解释你的设计选择' },
    { icon: Pencil, label: '写小作文', prompt: '写一篇关于"小模型大智慧：轻量AI的技术哲学"的深度短文，300字' },
    { icon: Sparkles, label: '深度推理', prompt: '为什么 RoPE 比 Learned Position Embedding 更好？从数学原理和实验两方面分析' },
  ];

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-950 transition-colors duration-300">
      {/* 顶栏 */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-neutral-100 dark:border-neutral-800/60 shrink-0 bg-white dark:bg-neutral-950 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <Fish className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300">FishAI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDark(!dark)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a href="https://github.com/FishLab-ai" target="_blank" rel="noopener noreferrer">
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Github className="w-4 h-4" />
            </button>
          </a>
        </div>
      </header>

      {/* 消息区域 */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Fish className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-neutral-400 dark:text-neutral-500">有什么可以帮你的？</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s.prompt)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 text-xs text-neutral-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:shadow-sm"
                  >
                    <s.icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map(msg => {
                const isStreaming = streaming && msg.role === 'assistant' && msg.id === messages[messages.length - 1]?.id;
                const prevLen = prevLenRef.current[msg.id] ?? 0;
                // 更新 prevLen 为当前长度 (下次渲染用)
                if (msg.role === 'assistant') {
                  prevLenRef.current[msg.id] = msg.content.length;
                }

                return (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeSlideIn_0.3s_ease-out]`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center mr-2.5 mt-0.5 shrink-0">
                        <Fish className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/15'
                          : 'bg-neutral-50 dark:bg-neutral-900/80 text-neutral-800 dark:text-neutral-200 border border-neutral-100 dark:border-neutral-800/60'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <>
                          {msg.content ? (
                            <Md text={msg.content} animate={isStreaming} prevLen={prevLen} />
                          ) : null}
                          {isStreaming && (
                            <span className="inline-block w-[2px] h-[14px] bg-blue-500 ml-0.5 align-middle rounded-full animate-[cursorBreathe_1.2s_ease-in-out_infinite]" />
                          )}
                        </>
                      ) : (
                        <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={chatEndRef} className="h-1" />
        </div>
      </main>

      {/* 回到底部按钮 */}
      {showScrollBtn && (
        <div className="relative">
          <button
            onClick={() => {
              userScrolledUp.current = false;
              scrollToBottom();
              setShowScrollBtn(false);
            }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 h-8 px-3 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all duration-200 hover:shadow-xl z-10"
          >
            <ArrowDown className="w-3 h-3" />
            回到底部
          </button>
        </div>
      )}

      {/* 输入区 */}
      <footer className="border-t border-neutral-100 dark:border-neutral-800/60 p-3 shrink-0 bg-white dark:bg-neutral-950">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="输入消息…"
            className="min-h-[42px] max-h-[160px] resize-none text-sm bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 rounded-xl transition-all duration-200"
            rows={1}
            disabled={streaming}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming}
            className="h-[42px] w-[42px] rounded-xl bg-blue-500 hover:bg-blue-600 text-white shrink-0 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}

// ────── 主页 ──────
export default function Home() {
  const [page, setPage] = useState<'landing' | 'chat'>('landing');
  const [dark, setDark] = useTheme();

  if (page === 'chat') return <Chat onBack={() => setPage('landing')} dark={dark} setDark={setDark} />;
  return <Landing onStart={() => setPage('chat')} dark={dark} setDark={setDark} />;
}
