'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import {
  Send, Github, ArrowRight, X, Code2, Fish,
  Sun, Moon, ChevronDown, Cpu, Binary, Zap, Sparkles, Copy, Check,
} from 'lucide-react';

// ────── Types ──────
interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/* ══════════════════════════════════════════════════════════════
 *  实时 Markdown 渲染引擎
 *  - 支持流式渐进渲染：未闭合的代码块、未闭合的加粗等
 *  - 支持标题 / 列表 / 引用 / 代码块 / 行内代码 / 加粗
 * ══════════════════════════════════════════════════════════════ */

// ── 代码块 ──
function CodeBlock({ lang, code, streaming }: { lang: string; code: string; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-border bg-muted/40 dark:bg-muted/40 group">
      <div className="px-3.5 py-1.5 text-[11px] font-mono text-muted-foreground dark:text-muted-foreground flex items-center justify-between border-b border-border bg-muted/60 dark:bg-muted/60">
        <span className="flex items-center gap-1.5">
          <Code2 className="w-3 h-3" />{lang || 'code'}
        </span>
        <div className="flex items-center gap-2">
          {streaming && (
            <span className="flex items-center gap-1 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" />
              生成中
            </span>
          )}
          {!streaming && (
            <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground/60">
              {copied ? <Check className="w-3.5 h-3.5 text-chart-2" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] leading-[1.65] font-mono text-foreground/80">
        <code>{code}{streaming ? '\n' : ''}</code>
      </pre>
    </div>
  );
}

// ── 行内 Markdown：加粗 + 行内代码 + 链接 ──
function InlineMd({ text }: { text: string }) {
  // 先拆行内代码，再在每个非代码段内拆加粗
  const segments = text.split(/(`[^`\n]+`)/g);
  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
          return <code key={i} className="bg-accent/60 dark:bg-primary/25 text-primary px-1.5 py-0.5 rounded-md text-[13px] font-mono">{seg.slice(1, -1)}</code>;
        }
        // 拆加粗
        const boldParts = seg.split(/(\*\*[^*]+\*\*)/g);
        if (boldParts.length === 1) {
          // 处理未闭合的 **（流式中可能遇到）
          const halfBold = seg.split(/(\*\*[^*]*)$/);
          if (halfBold.length > 1 && halfBold[1].startsWith('**') && !halfBold[1].endsWith('**')) {
            return <span key={i}><span>{halfBold[0]}</span><span className="text-muted-foreground">{halfBold[1]}</span></span>;
          }
          return <span key={i}>{seg}</span>;
        }
        return (
          <span key={i}>
            {boldParts.map((bp, j) => {
              if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
                return <strong key={j} className="font-semibold text-foreground">{bp.slice(2, -2)}</strong>;
              }
              return <span key={j}>{bp}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
}

// ── 主 Markdown 渲染器 ──
function Md({ text }: { text: string }) {
  // 第一步：拆出代码块（含未闭合的）
  const blocks: { type: 'code' | 'text'; content: string; lang: string }[] = useMemo(() => {
    const result: { type: 'code' | 'text'; content: string; lang: string }[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      const codeStart = remaining.indexOf('```');
      if (codeStart === -1) {
        result.push({ type: 'text', content: remaining, lang: '' });
        break;
      }
      if (codeStart > 0) {
        result.push({ type: 'text', content: remaining.slice(0, codeStart), lang: '' });
      }
      const afterFirst = remaining.slice(codeStart + 3);
      const codeEnd = afterFirst.indexOf('```');
      if (codeEnd === -1) {
        // 未闭合代码块（流式生成中）
        const lines = afterFirst.split('\n');
        const lang = /^[a-zA-Z][a-zA-Z0-9+._-]*$/.test(lines[0]) ? lines[0] : '';
        const code = lines.slice(lang ? 1 : 0).join('\n');
        result.push({ type: 'code', content: code, lang });
        break;
      } else {
        const inner = afterFirst.slice(0, codeEnd);
        const lines = inner.split('\n');
        const lang = /^[a-zA-Z][a-zA-Z0-9+._-]*$/.test(lines[0]) ? lines[0] : '';
        const code = lines.slice(lang ? 1 : 0).join('\n');
        result.push({ type: 'code', content: code, lang });
        remaining = afterFirst.slice(codeEnd + 3);
      }
    }
    return result;
  }, [text]);

  // 第二步：渲染
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'code') {
          const isLast = i === blocks.length - 1;
          return <CodeBlock key={i} lang={block.lang} code={block.content} streaming={isLast} />;
        }
        // 文本块：按行渲染，支持标题/列表/引用
        return <TextBlock key={i} text={block.content} />;
      })}
    </>
  );
}

// ── 文本块渲染：标题 / 列表 / 引用 / 普通段落 ──
function TextBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length === 0) return;
    if (listType === 'ul') {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-1.5 ml-4 space-y-0.5 list-disc list-outside text-foreground/80">
          {listItems.map((item, j) => <li key={j} className="text-sm leading-relaxed pl-0.5"><InlineMd text={item} /></li>)}
        </ul>
      );
    } else if (listType === 'ol') {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-1.5 ml-4 space-y-0.5 list-decimal list-outside text-foreground/80">
          {listItems.map((item, j) => <li key={j} className="text-sm leading-relaxed pl-0.5"><InlineMd text={item} /></li>)}
        </ol>
      );
    }
    listItems = [];
    listType = null;
  };

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (line.trim() === '') {
      flushList();
      i++;
      continue;
    }

    // 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const sizes: Record<number, string> = {
        1: 'text-lg font-bold',
        2: 'text-base font-bold',
        3: 'text-[15px] font-semibold',
        4: 'text-sm font-semibold',
        5: 'text-sm font-semibold',
        6: 'text-sm font-semibold',
      };
      elements.push(
        <div key={`h-${elements.length}`} className={`${sizes[level]} text-foreground mt-3 mb-1.5`}>
          <InlineMd text={content} />
        </div>
      );
      i++;
      continue;
    }

    // 引用
    if (line.startsWith('> ')) {
      flushList();
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${elements.length}`} className="my-1.5 border-l-3 border-primary/50 pl-3 text-muted-foreground text-sm leading-relaxed">
          {quoteLines.map((ql, j) => <p key={j} className="mb-0.5 last:mb-0"><InlineMd text={ql} /></p>)}
        </blockquote>
      );
      continue;
    }

    // 无序列表
    const ulMatch = line.match(/^[\s]*[-*]\s+(.+)/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      i++;
      continue;
    }

    // 有序列表
    const olMatch = line.match(/^[\s]*\d+[.)]\s+(.+)/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      i++;
      continue;
    }

    // 分隔线
    if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-border dark:border-border" />);
      i++;
      continue;
    }

    // 普通段落
    flushList();
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^(#{1,6}\s|> |[-*]\s|\d+[.)]\s)/)) {
      paraLines.push(lines[i]);
      i++;
    }
    elements.push(
      <p key={`p-${elements.length}`} className="my-1 text-sm leading-relaxed text-foreground/80">
        <InlineMd text={paraLines.join('\n')} />
      </p>
    );
  }

  flushList();
  return <>{elements}</>;
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

// ────── 主题切换按钮 ──────
function ThemeToggle({ dark, setDark }: { dark: boolean; setDark: (d: boolean) => void }) {
  return (
    <button
      onClick={() => setDark(!dark)}
      className={`relative rounded-full flex items-center transition-all duration-300 w-14 h-7 p-0.5 ${
        dark ? 'bg-muted-foreground hover:bg-muted-foreground' : 'bg-accent hover:bg-accent'
      }`}
      aria-label={dark ? '切换到亮色模式' : '切换到暗色模式'}
    >
      <span className={`flex items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out w-6 h-6 ${
        dark ? 'translate-x-7' : 'translate-x-0'
      }`}>
        {dark ? <Moon className="w-3.5 h-3.5 text-primary" /> : <Sun className="w-3.5 h-3.5 text-chart-3" />}
      </span>
      <Sun className={`absolute left-1.5 w-3 h-3 text-chart-3 transition-opacity duration-300 ${dark ? 'opacity-40' : 'opacity-0'}`} />
      <Moon className={`absolute right-1.5 w-3 h-3 text-primary/80 transition-opacity duration-300 ${dark ? 'opacity-0' : 'opacity-40'}`} />
    </button>
  );
}

// ────── 介绍页 ──────
function Landing({ onStart, dark, setDark }: { onStart: () => void; dark: boolean; setDark: (d: boolean) => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-500">
      <header className="h-14 flex items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Fish className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-foreground">FishAI</span>
          <span className="text-[10px] font-medium text-primary bg-accent/60 dark:bg-primary/30 dark:text-primary px-1.5 py-0.5 rounded-full">v2</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} setDark={setDark} />
          <a href="https://github.com/FishLab-ai" target="_blank" rel="noopener noreferrer"
            className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground/80 dark:hover:text-muted-foreground/40 hover:bg-muted dark:hover:bg-muted transition-all duration-200">
            <Github className="w-4 h-4" /><span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-md text-center space-y-7">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl shadow-primary/25 mx-auto">
              <Fish className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-chart-2 flex items-center justify-center shadow-lg shadow-chart-2/25">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">FishAI</h1>
            <p className="text-base text-muted-foreground leading-relaxed">FishLab-ai 自研 AI 助手，小体积最聪明</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: Cpu, label: 'Rust Engine' },
              { icon: Binary, label: '4-bit 量化' },
              { icon: Zap, label: '~12MB' },
            ].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-muted/80 border border-border text-[11px] font-medium text-muted-foreground shadow-sm">
                <t.icon className="w-3 h-3" />{t.label}
              </span>
            ))}
          </div>

          <div className="bg-white/60 dark:bg-muted/40 rounded-2xl border border-border p-4 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground mb-2.5">架构特性</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {['RoPE 旋转位置编码', 'SwiGLU 激活函数', 'RMSNorm 归一化', 'GQA 分组查询注意力', '权重绑定 WeightTying', '混合精度量化'].map((f, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary shrink-0" />{f}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={onStart}
            className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-2xl px-7 h-12 text-sm font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg"
          >
            开始聊天 <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </main>

      <footer className="h-12 flex items-center justify-center text-[11px] text-muted-foreground/60 dark:text-foreground/80 gap-1.5">
        <span>FishLab-ai</span><span>·</span><span>Built with Rust</span>
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

  // ── 打字机核心 ──
  // 核心思路：setInterval 固定节拍，每 tick 释放固定数量的字符
  // 这样字符出现节奏完全均匀，肉眼看到的就是"丝滑"
  const bufferRef = useRef('');              // SSE token 缓冲区
  const displayedRef = useRef('');           // 已显示文本
  const streamingIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 滚动控制 ──
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const isNearBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = dist < 100;
    isNearBottomRef.current = near;
    setShowScrollBtn(!near);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    chatEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) scrollToBottom();
  }, [messages, scrollToBottom]);

  // textarea 自适应
  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }
  }, [input]);

  // ── 打字机节拍循环 ──
  // 关键：25ms 一次 tick = 40 ticks/秒
  // 每个 tick 释放 N 个字符（根据缓冲积压量分级）
  // 分级越少跳动越少 → 丝滑感越强
  const startTypewriter = useCallback((aid: string) => {
    streamingIdRef.current = aid;
    bufferRef.current = '';
    displayedRef.current = '';

    // 固定 25ms 节拍
    timerRef.current = setInterval(() => {
      const bufLen = bufferRef.current.length;
      if (bufLen === 0) return;

      // ── 分级速度表 ──
      // 缓冲积压 ≤8 字 → 1字/tick = 40字/秒（丝滑基准）
      // 缓冲积压 9~20  → 2字/tick = 80字/秒
      // 缓冲积压 21~40 → 3字/tick = 120字/秒
      // 缓冲积压 >40   → 5字/tick = 200字/秒（快速追赶）
      let charsPerTick: number;
      if (bufLen <= 8) charsPerTick = 1;
      else if (bufLen <= 20) charsPerTick = 2;
      else if (bufLen <= 40) charsPerTick = 3;
      else charsPerTick = 5;

      const toShow = bufferRef.current.slice(0, charsPerTick);
      bufferRef.current = bufferRef.current.slice(charsPerTick);
      displayedRef.current += toShow;

      const current = displayedRef.current;
      const id = streamingIdRef.current;
      if (id) {
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id === id);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = { ...prev[idx], content: current };
          return updated;
        });
      }
    }, 25);
  }, []);

  const stopTypewriter = useCallback(() => {
    // flush 剩余缓冲
    if (bufferRef.current.length > 0) {
      displayedRef.current += bufferRef.current;
      bufferRef.current = '';
      const current = displayedRef.current;
      const id = streamingIdRef.current;
      if (id) {
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id === id);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = { ...prev[idx], content: current };
          return updated;
        });
      }
    }
    streamingIdRef.current = null;
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── 发送消息 ──
  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;

    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: 'user', content };
    const aid = `a_${Date.now()}`;
    setMessages(prev => [...prev, userMsg, { id: aid, role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);
    isNearBottomRef.current = true;
    setTimeout(() => scrollToBottom(), 50);

    startTypewriter(aid);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId: convId.current }),
      });
      if (!res.ok) throw new Error('请求失败');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无响应流');

      const dec = new TextDecoder();
      let buf = '';

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
              bufferRef.current += obj.content;
            }
          } catch {}
        }
      }
    } catch {
      if (displayedRef.current.length === 0) {
        setMessages(prev => prev.map(m =>
          m.id === aid ? { ...m, content: '出了点问题，请重试。' } : m
        ));
      }
    } finally {
      stopTypewriter();
      setStreaming(false);
    }
  }, [streaming, scrollToBottom, startTypewriter, stopTypewriter]);

  useEffect(() => {
    return () => { if (timerRef.current !== null) clearInterval(timerRef.current); };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  // ── 示例建议：更自然、实用 ──
  const suggestions = [
    { icon: Code2, label: 'Python 快排算法', prompt: '用 Python 写一个快速排序算法，加上详细注释' },
    { icon: Sparkles, label: '解释 Rust 所有权', prompt: '用通俗易懂的方式解释 Rust 的所有权机制' },
    { icon: Fish, label: '今天有什么新闻', prompt: '今天有什么值得关注的科技新闻？' },
  ];

  return (
    <div className="h-screen flex flex-col bg-background transition-colors duration-500">
      {/* 顶栏 */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0 bg-white/80 dark:bg-background backdrop-blur-xl z-10">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground/60 hover:bg-muted dark:hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <Fish className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-foreground dark:text-muted-foreground/40">FishAI</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} setDark={setDark} />
          <a href="https://github.com/FishLab-ai" target="_blank" rel="noopener noreferrer"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground/60 hover:bg-muted dark:hover:bg-muted transition-colors">
            <Github className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* 消息区域 */}
      <main ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                <Fish className="w-7 h-7 text-white" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-base font-medium text-foreground/80">有什么可以帮你的？</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">试试下面的快捷指令</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => send(s.prompt)}
                    className="flex-1 flex items-center gap-2.5 p-3 rounded-xl border border-border/80 dark:border-border hover:border-primary/40 dark:hover:border-primary hover:bg-accent/50 dark:hover:bg-primary/15 text-left transition-all duration-200 hover:shadow-sm group">
                    <div className="w-8 h-8 rounded-lg bg-accent/60 dark:bg-primary/25 flex items-center justify-center shrink-0 group-hover:bg-accent dark:group-hover:bg-primary/20 transition-colors">
                      <s.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground/80">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => {
                const isStreaming = streaming && msg.role === 'assistant' && msg.id === streamingIdRef.current;
                return (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeSlideIn_0.25s_ease-out]`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center mr-2.5 mt-0.5 shrink-0 shadow-sm shadow-primary/20">
                        <Fish className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary to-primary text-white px-4 py-2.5 shadow-md shadow-primary/15'
                        : 'bg-white dark:bg-foreground/70 text-foreground dark:text-muted-foreground/40 border border-border/80 dark:border-border px-4 py-3 shadow-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <>
                          {msg.content ? (
                            <div className="prose-fishai"><Md text={msg.content} /></div>
                          ) : (
                            <div className="flex items-center gap-1.5 py-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-[dotBounce_1.4s_ease-in-out_infinite]" />
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-[dotBounce_1.4s_ease-in-out_0.2s_infinite]" />
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-[dotBounce_1.4s_ease-in-out_0.4s_infinite]" />
                            </div>
                          )}
                          {isStreaming && msg.content && (
                            <span className="inline-block w-[2px] h-[15px] bg-primary ml-0.5 align-middle rounded-full animate-[cursorBreathe_1.2s_ease-in-out_infinite]" />
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

      {/* 回到底部 */}
      <div className={`relative transition-all duration-300 ${showScrollBtn ? 'h-10' : 'h-0'}`}>
        {showScrollBtn && (
          <button onClick={() => { isNearBottomRef.current = true; scrollToBottom(); setShowScrollBtn(false); }}
            className="absolute -top-5 left-1/2 -translate-x-1/2 h-9 px-3.5 rounded-full bg-white dark:bg-muted border border-border dark:border-border shadow-lg flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary dark:hover:text-primary transition-all duration-200 hover:shadow-xl hover:border-primary/40 dark:hover:border-primary z-10">
            <ChevronDown className="w-3.5 h-3.5" />回到底部
          </button>
        )}
      </div>

      {/* 输入区 */}
      <footer className="border-t border-border p-3 sm:p-4 shrink-0 bg-white/80 dark:bg-background backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex gap-2.5 items-end">
          <div className="flex-1">
            <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder="输入消息…"
              className="min-h-[44px] max-h-[160px] resize-none text-sm bg-background dark:bg-foreground border-border dark:border-border focus-visible:ring-primary/30 focus-visible:border-primary/60 rounded-xl transition-all duration-200 placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
              rows={1} disabled={streaming} />
          </div>
          <button onClick={() => send(input)} disabled={!input.trim() || streaming}
            className="h-[44px] w-[44px] rounded-xl bg-primary hover:bg-primary/90 text-white shrink-0 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 active:scale-95">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="max-w-2xl mx-auto mt-1.5 text-center">
          <span className="text-[10px] text-muted-foreground/60 dark:text-foreground/80">FishAI · 基于 Rust 推理引擎 · 混合精度量化</span>
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
