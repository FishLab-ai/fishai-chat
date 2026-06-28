'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppStore, type ChatMessage, type UserInfo, type ConversationItem } from '@/lib/store';
import { API_BASE } from '@/lib/api';
import { ChatInput } from '@/components/chat-input';
import { ChatMessageItem } from '@/components/chat-message';
import { Sidebar } from '@/components/sidebar';
import { SettingsDialog } from '@/components/settings-dialog';
import { AuthDialog } from '@/components/auth-dialog';

import { ChevronDown, Fish, Plus, AlignLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useI18n, type Translations } from '@/lib/i18n';

const STREAM_TIMEOUT_MS = 30_000;

function useChatStream(updateMessage: (id: string, updates: Partial<ChatMessage>) => void) {
  const thinkingRef = useRef('');
  const searchResultsRef = useRef('');
  const bufferRef = useRef('');
  const displayedRef = useRef('');
  const streamingIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

  const startTypewriter = useCallback((aid: string) => {
    streamingIdRef.current = aid;
    setStreamingMsgId(aid);
    bufferRef.current = '';
    displayedRef.current = '';
    if (timerRef.current !== null) {clearInterval(timerRef.current); timerRef.current = null;}
    timerRef.current = setInterval(() => {
      const bufLen = bufferRef.current.length;
      if (bufLen === 0) {return;}
      let charsPerTick: number;
      if (bufLen <= 8) {charsPerTick = 1;}
      else if (bufLen <= 20) {charsPerTick = 2;}
      else if (bufLen <= 40) {charsPerTick = 3;}
      else {charsPerTick = 5;}
      const toShow = bufferRef.current.slice(0, charsPerTick);
      bufferRef.current = bufferRef.current.slice(charsPerTick);
      displayedRef.current += toShow;
      const { current } = displayedRef;
      const id = streamingIdRef.current;
      if (id) {updateMessage(id, { content: current, thinking: thinkingRef.current || null, searchResults: searchResultsRef.current || null });}
    }, 25);
  }, [updateMessage]);

  const stopTypewriter = useCallback(() => {
    if (bufferRef.current.length > 0) {displayedRef.current += bufferRef.current; bufferRef.current = '';}
    const { current } = displayedRef;
    const id = streamingIdRef.current;
    if (id) {updateMessage(id, { content: current, thinking: thinkingRef.current || null, searchResults: searchResultsRef.current || null });}
    streamingIdRef.current = null;
    setStreamingMsgId(null);
    if (timerRef.current !== null) {clearInterval(timerRef.current); timerRef.current = null;}
  }, [updateMessage]);

  return { thinkingRef, searchResultsRef, bufferRef, startTypewriter, stopTypewriter, streamingMsgId };
}

function MessageList({ messages, streaming, streamingMsgId, activeDeepThinking }: {
  messages: ChatMessage[]; streaming: boolean; streamingMsgId: string | null; activeDeepThinking: boolean;
}) {
  const deepThinkingMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const msg of messages) {
      map[msg.id] = streaming && msg.id === streamingMsgId ? activeDeepThinking : !!msg.thinking;
    }
    return map;
  }, [messages, streaming, streamingMsgId, activeDeepThinking]);

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <ChatMessageItem key={msg.id} msg={msg} isStreaming={streaming} streamingId={streamingMsgId}
          deepThinking={deepThinkingMap[msg.id] ?? false} />
      ))}
    </div>
  );
}

function processSSELine(data: string, aid: string, updateMessage: (id: string, updates: Partial<ChatMessage>) => void,
  setCurrentConversationId: (id: string) => void, refreshConversations: () => void,
  bufferRef: React.MutableRefObject<string>, thinkingRef: React.MutableRefObject<string>,
  searchResultsRef: React.MutableRefObject<string>, t: Translations) {
  if (data === '[DONE]') {return;}
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
      if (obj.conversationId) {setCurrentConversationId(obj.conversationId); refreshConversations();}
    } else if (obj.type === 'error') {
      toast({ title: obj.error || t.chat.requestFailed, variant: 'destructive' });
    } else if (obj.content) {
      bufferRef.current += obj.content;
    }
  } catch {
    // Ignore parse errors
  }
}

function handleStreamError(err: unknown, aid: string, updateMessage: (id: string, updates: Partial<ChatMessage>) => void,
  bufferRef: React.MutableRefObject<string>, thinkingRef: React.MutableRefObject<string>, t: Translations) {
  if (err instanceof DOMException && err.name === 'AbortError') {
    if (bufferRef.current.length === 0 && thinkingRef.current.length === 0) {
      updateMessage(aid, { content: t.chat.stoppedGeneration });
    }
  } else {
    const errMsg = err instanceof Error ? err.message : '';
    if (bufferRef.current.length === 0 && thinkingRef.current.length === 0) {
      updateMessage(aid, { content: `${t.chat.somethingWentWrong}：${errMsg}` });
    } else {
      toast({ title: `${t.chat.partialContentMissing}：${errMsg}`, variant: 'destructive' });
    }
  }
}

function ChatHeader({ onOpenSidebar, onNewChat, t }: { onOpenSidebar: () => void; onNewChat: () => void; t: Translations }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex items-center h-11 px-3">
      <button onClick={onOpenSidebar}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
        title={t.chat.chatHistory}>
        <AlignLeft className="w-4 h-4" />
      </button>
      <button onClick={onNewChat}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
        title={t.chat.newChat}>
        <Plus className="w-4 h-4" />
      </button>
    </header>
  );
}

function ScrollToBottomBtn({ onClick, t }: { onClick: () => void; t: Translations }) {
  return (
    <div className="fixed bottom-40 left-0 right-0 flex justify-center z-20 pointer-events-none">
      <button onClick={onClick}
        className="pointer-events-auto h-8 px-3 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 shadow-lg flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all duration-200 hover:border-emerald-300/60 dark:hover:border-emerald-600/40">
        <ChevronDown className="w-3.5 h-3.5" />
        {t.common.scrollToBottom}
      </button>
    </div>
  );
}

function readSSEStream(reader: ReadableStreamDefaultReader<Uint8Array>, controller: AbortController, aid: string,
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void,
  setCurrentConversationId: (id: string) => void, refreshConversations: () => void,
  bufferRef: React.MutableRefObject<string>, thinkingRef: React.MutableRefObject<string>,
  searchResultsRef: React.MutableRefObject<string>, t: Translations) {
  const dec = new TextDecoder();
  let sseBuf = '';
  return new Promise<void>(async (resolve) => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {break;}
      sseBuf += dec.decode(value, { stream: true });
      const lines = sseBuf.split('\n');
      sseBuf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) {continue;}
        if (controller.signal.aborted) {break;}
        const data = line.slice(6).trim();
        processSSELine(data, aid, updateMessage, setCurrentConversationId, refreshConversations, bufferRef, thinkingRef, searchResultsRef, t);
      }
    }
    resolve();
  });
}

function useSendCallback({ streaming, user, currentConversationId, deepThinking, webSearch, memoryMode,
  addMessage, updateMessage, setCurrentConversationId, refreshConversations,
  setInput, setStreaming, setActiveDeepThinking, scrollToBottom, startTypewriter,
  sendingRef, abortRef, isNearBottomRef, bufferRef, thinkingRef, searchResultsRef, t }: {
  streaming: boolean; user: UserInfo | null; currentConversationId: string | null;
  deepThinking: boolean; webSearch: boolean; memoryMode: string;
  addMessage: (m: ChatMessage) => void; updateMessage: (id: string, u: Partial<ChatMessage>) => void;
  setCurrentConversationId: (id: string) => void; refreshConversations: () => void;
  setInput: (v: string) => void; setStreaming: (v: boolean) => void; setActiveDeepThinking: (v: boolean) => void;
  scrollToBottom: (smooth?: boolean) => void; startTypewriter: (aid: string) => void;
  sendingRef: React.MutableRefObject<boolean>; abortRef: React.MutableRefObject<AbortController | null>;
  isNearBottomRef: React.MutableRefObject<boolean>; bufferRef: React.MutableRefObject<string>;
  thinkingRef: React.MutableRefObject<string>; searchResultsRef: React.MutableRefObject<string>;
  t: Translations;
}) {
  return useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || sendingRef.current || streaming) {return;}
    if (!user) {toast({ title: t.chat.pleaseLogin, description: t.chat.loginToSave, variant: 'destructive' }); return;}
    sendingRef.current = true;
    setActiveDeepThinking(deepThinking);
    const aid = `a_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    addMessage({ id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, role: 'user', content });
    addMessage({ id: aid, role: 'assistant', content: '', thinking: null, searchResults: null });
    setInput(''); setStreaming(true); isNearBottomRef.current = true;
    thinkingRef.current = ''; searchResultsRef.current = ''; bufferRef.current = '';
    setTimeout(() => scrollToBottom(), 50);
    startTypewriter(aid);
    const controller = new AbortController();
    abortRef.current = controller;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const resetTimeout = () => {
      if (timeoutId) {clearTimeout(timeoutId);}
      timeoutId = setTimeout(() => {controller.abort(); toast({ title: t.chat.responseTimeout, variant: 'destructive' });}, STREAM_TIMEOUT_MS);
    };
    resetTimeout();
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversationId: currentConversationId, userId: user?.id, deepThinking, webSearch, memoryMode }),
        signal: controller.signal,
      });
      if (!res.ok) {const errData = await res.json().catch(() => ({})); throw new Error(errData.error || t.chat.requestFailed);}
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('text/event-stream')) {const errText = await res.text().catch(() => ''); throw new Error(errText || t.chat.serverResponseError);}
      const reader = res.body?.getReader();
      if (!reader) {throw new Error(t.chat.noResponseStream);}
      await readSSEStream(reader, controller, aid, updateMessage, setCurrentConversationId, refreshConversations, bufferRef, thinkingRef, searchResultsRef, t);
    } catch (err: unknown) {
      handleStreamError(err, aid, updateMessage, bufferRef, thinkingRef, t);
    } finally {
      if (timeoutId) {clearTimeout(timeoutId);}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, scrollToBottom, startTypewriter, addMessage, updateMessage, currentConversationId, setCurrentConversationId, refreshConversations, user, deepThinking, webSearch, memoryMode, setStreaming, setInput, setActiveDeepThinking, t]);
}

function useChatActions({ user, currentConversationId, setCurrentConversationId, setConversations, messages, setMessages,
  addMessage, updateMessage, streaming, setStreaming, deepThinking, webSearch, memoryMode, t }: {
  user: UserInfo | null; currentConversationId: string | null;
  setCurrentConversationId: (id: string) => void; setConversations: (c: ConversationItem[]) => void;
  messages: ChatMessage[]; setMessages: (m: ChatMessage[]) => void;
  addMessage: (m: ChatMessage) => void; updateMessage: (id: string, u: Partial<ChatMessage>) => void;
  streaming: boolean; setStreaming: (v: boolean) => void;
  deepThinking: boolean; webSearch: boolean; memoryMode: string;
  t: Translations;
}) {
  const [input, setInput] = useState('');
  const [activeDeepThinking, setActiveDeepThinking] = useState(false);
  const sendingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const isNearBottomRef = useRef(true);
  const bufferRef = useRef('');
  const thinkingRef = useRef('');
  const searchResultsRef = useRef('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const { startTypewriter, stopTypewriter, streamingMsgId } = useChatStream(updateMessage);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) {return;}
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = dist < 100;
    isNearBottomRef.current = near;
    setShowScrollBtn(!near);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    chatEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {scrollToBottom();}
  }, [messages, scrollToBottom]);

  const refreshConversations = useCallback(async () => {
    if (!user) {return;}
    try {
      const res = await fetch(`${API_BASE}/api/conversations?userId=${user.id}`);
      if (res.ok) {setConversations(await res.json());}
    } catch {
      // Ignore
    }
  }, [user, setConversations]);

  const handleNewChat = useCallback(async () => {
    if (!user) {toast({ title: t.chat.pleaseLogin, description: t.chat.loginToCreate, variant: 'destructive' }); return;}
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: t.chat.newConversation }),
      });
      if (res.ok) {const conv = await res.json(); setCurrentConversationId(conv.id); setMessages([]); refreshConversations();}
    } catch {
      toast({ title: t.chat.createFailed, variant: 'destructive' });
    }
  }, [user, setCurrentConversationId, setMessages, refreshConversations, t]);

  const handleStop = useCallback(() => {
    if (abortRef.current) {abortRef.current.abort(); abortRef.current = null;}
    stopTypewriter(); setStreaming(false); sendingRef.current = false;
  }, [stopTypewriter, setStreaming]);

  const send = useSendCallback({
    streaming, user, currentConversationId, deepThinking, webSearch, memoryMode,
    addMessage, updateMessage, setCurrentConversationId, refreshConversations,
    setInput, setStreaming, setActiveDeepThinking, scrollToBottom, startTypewriter,
    sendingRef, abortRef, isNearBottomRef, bufferRef, thinkingRef, searchResultsRef, t,
  });

  return {
    input, setInput, send, handleStop, handleNewChat, activeDeepThinking, streamingMsgId,
    scrollContainerRef, chatEndRef, handleScroll, showScrollBtn, setShowScrollBtn, scrollToBottom,
  };
}

export default function ChatPage() {
  const {
    user, authOpen, setAuthOpen, currentConversationId, setCurrentConversationId,
    setConversations, messages, setMessages, addMessage, updateMessage,
    streaming, setStreaming, deepThinking, webSearch, memoryMode, setSidebarOpen,
  } = useAppStore();
  const { t } = useI18n();

  const chatActions = useChatActions({
    user, currentConversationId, setCurrentConversationId, setConversations, messages, setMessages,
    addMessage, updateMessage, streaming, setStreaming, deepThinking, webSearch, memoryMode, t,
  });

  const {
    input, setInput, send, handleStop, handleNewChat, activeDeepThinking, streamingMsgId,
    scrollContainerRef, chatEndRef, handleScroll, showScrollBtn, setShowScrollBtn, scrollToBottom,
  } = chatActions;

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <main ref={scrollContainerRef} onScroll={handleScroll} className="h-full overflow-y-auto scroll-smooth">
        <div className="max-w-2xl mx-auto px-4 pt-14 pb-52">
          {messages.length === 0
            ? (
              <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <Fish className="w-7 h-7 text-white" />
                </div>
                <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">{t.chat.welcomeTitle}</p>
              </div>
            )
            : <MessageList messages={messages} streaming={streaming} streamingMsgId={streamingMsgId} activeDeepThinking={activeDeepThinking} />}
          <div ref={chatEndRef} className="h-1" />
        </div>
      </main>
      <ChatHeader onOpenSidebar={() => setSidebarOpen(true)} onNewChat={handleNewChat} t={t} />
      {showScrollBtn && (
        <ScrollToBottomBtn onClick={() => {setShowScrollBtn(false); scrollToBottom();}} t={t} />
      )}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <ChatInput input={input} setInput={setInput} onSend={() => send(input)} onStop={handleStop} streaming={streaming} />
      </div>
      <Sidebar />
      <SettingsDialog />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}