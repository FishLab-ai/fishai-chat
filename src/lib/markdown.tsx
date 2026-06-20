'use client';

import { useState, useMemo } from 'react';
import { Code2, Copy, Check } from 'lucide-react';

// ── 代码块 ──
function CodeBlock({ lang, code, streaming }: { lang: string; code: string; streaming: boolean }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-700/50 bg-[#fafafa] dark:bg-neutral-800/40 group">
      <div className="px-3.5 py-1.5 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-700/40 bg-neutral-100/60 dark:bg-neutral-800/60">
        <span className="flex items-center gap-1.5">
          <Code2 className="w-3 h-3" />{lang || 'code'}
        </span>
        <div className="flex items-center gap-2">
          {streaming && (
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              生成中
            </span>
          )}
          {!streaming && (
            <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] leading-[1.65] font-mono text-neutral-700 dark:text-neutral-300">
        <code>{code}{streaming ? '\n' : ''}</code>
      </pre>
    </div>
  );
}

// ── 行内 Markdown：加粗 + 行内代码 ──
function InlineMd({ text }: { text: string }) {
  const segments = text.split(/(`[^`\n]+`)/g);
  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
          return <code key={i} className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md text-[13px] font-mono">{seg.slice(1, -1)}</code>;
        }
        const boldParts = seg.split(/(\*\*[^*]+\*\*)/g);
        if (boldParts.length === 1) {
          const halfBold = seg.split(/(\*\*[^*]*)$/);
          if (halfBold.length > 1 && halfBold[1].startsWith('**') && !halfBold[1].endsWith('**')) {
            return <span key={i}><span>{halfBold[0]}</span><span className="text-neutral-400">{halfBold[1]}</span></span>;
          }
          return <span key={i}>{seg}</span>;
        }
        return (
          <span key={i}>
            {boldParts.map((bp, j) => {
              if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
                return <strong key={j} className="font-semibold text-neutral-900 dark:text-neutral-50">{bp.slice(2, -2)}</strong>;
              }
              return <span key={j}>{bp}</span>;
            })}
          </span>
        );
      })}
    </span>
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
        <ul key={`ul-${elements.length}`} className="my-1.5 ml-4 space-y-0.5 list-disc list-outside text-neutral-700 dark:text-neutral-300">
          {listItems.map((item, j) => <li key={j} className="text-sm leading-relaxed pl-0.5"><InlineMd text={item} /></li>)}
        </ul>
      );
    } else if (listType === 'ol') {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-1.5 ml-4 space-y-0.5 list-decimal list-outside text-neutral-700 dark:text-neutral-300">
          {listItems.map((item, j) => <li key={j} className="text-sm leading-relaxed pl-0.5"><InlineMd text={item} /></li>)}
        </ol>
      );
    }
    listItems = [];
    listType = null;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      flushList();
      i++;
      continue;
    }

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
        <div key={`h-${elements.length}`} className={`${sizes[level]} text-neutral-900 dark:text-neutral-100 mt-3 mb-1.5`}>
          <InlineMd text={content} />
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      flushList();
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${elements.length}`} className="my-1.5 border-l-3 border-emerald-400/60 dark:border-emerald-500/40 pl-3 text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
          {quoteLines.map((ql, j) => <p key={j} className="mb-0.5 last:mb-0"><InlineMd text={ql} /></p>)}
        </blockquote>
      );
      continue;
    }

    const ulMatch = line.match(/^[\s]*[-*]\s+(.+)/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      i++;
      continue;
    }

    const olMatch = line.match(/^[\s]*\d+[.)]\s+(.+)/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      i++;
      continue;
    }

    if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-neutral-200 dark:border-neutral-700" />);
      i++;
      continue;
    }

    flushList();
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^(#{1,6}\s|> |[-*]\s|\d+[.)]\s)/)) {
      paraLines.push(lines[i]);
      i++;
    }
    elements.push(
      <p key={`p-${elements.length}`} className="my-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <InlineMd text={paraLines.join('\n')} />
      </p>
    );
  }

  flushList();
  return <>{elements}</>;
}

// ── 主 Markdown 渲染器 ──
export function Md({ text, streaming = false }: { text: string; streaming?: boolean }) {
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

  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === 'code') {
          const isLast = i === blocks.length - 1;
          return <CodeBlock key={i} lang={block.lang} code={block.content} streaming={streaming && isLast} />;
        }
        return <TextBlock key={i} text={block.content} />;
      })}
    </>
  );
}