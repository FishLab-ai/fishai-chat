'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore, type ChatMessage } from '@/lib/store';
import { API_BASE } from '@/lib/api';
import { ChatInput } from '@/components/chat-input';
import { ChatMessageItem } from '@/components/chat-message';
import { Sidebar } from '@/components/sidebar';
import { SettingsDialog } from '@/components/settings-dialog';
import { AuthDialog } from '@/components/auth-dialog';
import { ChevronDown, Fish, Code2, Sparkles, Plus, AlignLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const suggestions = [
  { icon: Code2, label: 'Python 快排算法', prompt: '用 Python 写一个快速排序算法，加上详细注释' },
  { icon: Sparkles, label: '解释 Rust 所有权', prompt: '用通俗易懂的方式解释 Rust 的所有权机制' },
  { icon: Fish, label: '今天有什么新闻', prompt: '今天有什么值得关注的科技新闻？' },
];

const STREAM_TIMEOUT_MS = 30_000;

export default function ChatPage() {
  const {
    user,
    authOpen,
    setAuthOpen,
    currentConversationId,
    setCurrentConversationId,
    setConversations,
    messages,
    setMessages,
    addMessage,
    updateMessage,
    streaming,
    setStreaming,
    deepThinking,
    webSearch,
    memoryMode,
    setSidebarOpen,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const bufferRef = useRef('');
  const displayedRef = useRef('');
  const streamingIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeDeepThinkingRef = useRef(false);
  const activeWebSearchRef = useRef(false);
  const sendingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

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

  const startTypewriter = useCallback((aid: string) => {
    streamingIdRef.current = aid;
    setStreamingMsgId(aid);
    bufferRef.current = '';
    displayedRef.current = '';

    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setInterval(() => {
      const bufLen = bufferRef.current.length;
      if (bufLen === 0) return;

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
        updateMessage(id, {
          content: current,
          thinking: thinkingRef.current || null,
          searchResults: searchResultsRef.current || null,
        });
      }
    }, 25);
  }, [updateMessage]);

  const thinkingRef = useRef('');
  const searchResultsRef = useRef('');

  const stopTypewriter = useCallback(() => {
    if (bufferRef.current.length > 0) {
      displayedRef.current += bufferRef.current;
      bufferRef.current = '';
    }
    const current = displayedRef.current;
    const id = streamingIdRef.current;
    if (id) {
      updateMessage(id, {
        content: current,
        thinking: thinkingRef.current || null,
        searchResults: searchResultsRef.current || null,
      });
    }
    streamingIdRef.current = null;
    setStreamingMsgId(null);
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [updateMessage]);

  const refreshConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/conversations?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // Ignore
    }
  }, [user, setConversations]);

  const handleNewChat = useCallback(async () => {
    if (!user) {
      toast({ title: '请先登录', description: '登录后可创建新对话', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: '新对话' }),
      });
      if (res.ok) {
        const conv = await res.json();
        setCurrentConversationId(conv.id);
        setMessages([]);
        refreshConversations();
      }
    } catch {
      toast({ title: '创建失败', variant: 'destructive' });
    }
  }, [user, setCurrentConversationId, setMessages, refreshConversations]);

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    stopTypewriter();
    setStreaming(false);
    sendingRef.current = false;
  }, [stopTypewriter, setStreaming]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content) return;
      if (sendingRef.current) return;
      if (streaming) return;

      if (!user) {
        toast({ title: '请先登录', description: '登录后对话记录会被保存', variant: 'destructive' });
        return;
      }

      sendingRef.current = true;
      activeDeepThinkingRef.current = deepThinking;
      activeWebSearchRef.current = webSearch;

      const userMsg: ChatMessage = {
        id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        content,
      };
      const aid = `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const assistantMsg: ChatMessage = {
        id: aid,
        role: 'assistant',
        content: '',
        thinking: null,
        searchResults: null,
      };

      addMessage(userMsg);
      addMessage(assistantMsg);
      setInput('');
      setStreaming(true);
      isNearBottomRef.current = true;
      thinkingRef.current = '';
      searchResultsRef.current = '';
      setTimeout(() => scrollToBottom(), 50);

      startTypewriter(aid);

      const controller = new AbortController();
      abortRef.current = controller;

      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          controller.abort();
          toast({ title: '响应超时，请重试', variant: 'destructive' });
        }, STREAM_TIMEOUT_MS);
      };
      resetTimeout();

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            conversationId: currentConversationId,
            userId: user?.id,
            deepThinking,
            webSearch,
            memoryMode,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || '请求失败');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('无响应流');

        const dec = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          resetTimeout();

          buf += dec.decode(value, { stream: true });

          const lines = buf.split('\n');
          buf = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const obj = JSON.parse(data);

              if (obj.type === 'thinking') {
                thinkingRef.current += obj.content || '';
                updateMessage(aid, { thinking: thinkingRef.current });
              } else if (obj.type === 'content') {
                bufferRef.current += obj.content || '';
              } else if (obj.type === 'search') {
                searchResultsRef.current = obj.content || '';
                updateMessage(aid, { searchResults: searchResultsRef.current });
              } else if (obj.type === 'done') {
                if (obj.conversationId) {
                  setCurrentConversationId(obj.conversationId);
                  refreshConversations();
                }
              } else if (obj.type === 'error') {
                toast({ title: obj.error || '请求失败', variant: 'destructive' });
              } else if (obj.content) {
                bufferRef.current += obj.content;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          if (displayedRef.current.length === 0 && thinkingRef.current.length === 0) {
            updateMessage(aid, { content: '已停止生成。' });
          }
        } else {
          const errMsg = err instanceof Error ? err.message : '未知错误';
          if (displayedRef.current.length === 0 && thinkingRef.current.length === 0) {
            updateMessage(aid, { content: `出了点问题：${errMsg}，请重试。` });
          } else {
            toast({ title: `部分内容可能缺失：${errMsg}`, variant: 'destructive' });
          }
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        stopTypewriter();
        setStreaming(false);
        sendingRef.current = false;
        abortRef.current = null;
      }
    },
    [
      streaming, scrollToBottom, startTypewriter, stopTypewriter,
      addMessage, updateMessage, currentConversationId,
      setCurrentConversationId, refreshConversations, user,
      deepThinking, webSearch, memoryMode, setStreaming,
    ]
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-48px)] overflow-hidden">
      <header className="shrink-0 flex items-center h-11 px-3 z-10">
        <button
          onClick={() => setSidebarOpen(true)}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
          title="聊天记录"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleNewChat}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
          title="新对话"
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <Fish className="w-7 h-7 text-white" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
                  有什么可以帮你的？
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  试试下面的快捷指令
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s.prompt)}
                    disabled={streaming}
                    className="flex-1 flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/60 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all duration-200 hover:shadow-sm group disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                      <s.icon className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  msg={msg}
                  isStreaming={streaming}
                  streamingId={streamingMsgId}
                  deepThinking={
                    streaming && msg.id === streamingMsgId
                      ? activeDeepThinkingRef.current
                      : !!msg.thinking
                  }
                />
              ))}
            </div>
          )}
          <div ref={chatEndRef} className="h-1" />
        </div>
      </main>

      {showScrollBtn && (
        <div className="shrink-0 flex justify-center -mt-10 pb-1 z-10 pointer-events-none">
          <button
            onClick={() => {
              isNearBottomRef.current = true;
              scrollToBottom();
              setShowScrollBtn(false);
            }}
            className="pointer-events-auto h-8 px-3 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 shadow-lg flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 hover:border-emerald-300/60 dark:hover:border-emerald-600/40"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            回到底部
          </button>
        </div>
      )}

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={() => send(input)}
        onStop={handleStop}
        streaming={streaming}
      />

      <Sidebar />
      <SettingsDialog />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}