'use client';

import { create } from 'zustand';

// ── localStorage 混淆工具 ──
const STORE_KEY = 'fishai-user';
const OBFUSCATE_PREFIX = 'f1:';

function obfuscate(data: string): string {
  return OBFUSCATE_PREFIX + btoa(unescape(encodeURIComponent(data)));
}

function deobfuscate(encoded: string): string | null {
  try {
    if (!encoded.startsWith(OBFUSCATE_PREFIX)) {
      return encoded;
    }
    return decodeURIComponent(escape(atob(encoded.slice(OBFUSCATE_PREFIX.length))));
  } catch {
    return null;
  }
}

// ── Types ──
export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string | null;
  searchResults?: string | null;
  createdAt?: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

// ── Store State ──
interface AppStore {
  // Auth
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  initAuth: () => void;
  logout: () => void;

  // Chat
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  conversations: ConversationItem[];
  setConversations: (convs: ConversationItem[]) => void;
  messages: ChatMessage[];
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;

  // Chat settings
  deepThinking: boolean;
  setDeepThinking: (v: boolean) => void;
  webSearch: boolean;
  setWebSearch: (v: boolean) => void;
  memoryMode: 'aggressive' | 'balanced' | 'passive';
  setMemoryMode: (v: 'aggressive' | 'balanced' | 'passive') => void;

  // Theme
  themeMode: ThemeMode;
  setThemeMode: (v: ThemeMode) => void;

  // Settings
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;

  // Streaming
  streaming: boolean;
  setStreaming: (v: boolean) => void;

  // Auth dialog
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Auth
  user: null,
  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem(STORE_KEY, obfuscate(JSON.stringify(user)));
    } else {
      localStorage.removeItem(STORE_KEY);
    }
  },
  initAuth: () => {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (stored) {
        const raw = deobfuscate(stored);
        if (raw) {
          const user = JSON.parse(raw) as UserInfo;
          set({ user });
        }
      }
    } catch {}
  },
  logout: () => {
    set({ user: null, currentConversationId: null, conversations: [], messages: [] });
    localStorage.removeItem(STORE_KEY);
  },

  // Chat
  currentConversationId: null,
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  conversations: [],
  setConversations: (convs) => set({ conversations: convs }),
  messages: [],
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  // Chat settings
  deepThinking: false,
  setDeepThinking: (v) => set({ deepThinking: v }),
  webSearch: false,
  setWebSearch: (v) => set({ webSearch: v }),
  memoryMode: 'balanced',
  setMemoryMode: (v) => set({ memoryMode: v }),

  // Theme
  themeMode: 'system',
  setThemeMode: (v) => {
    set({ themeMode: v });
    localStorage.setItem('fishai-theme-mode', v);
    applyTheme(v);
  },

  // Settings
  settingsOpen: false,
  setSettingsOpen: (v) => set({ settingsOpen: v }),

  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  // Streaming
  streaming: false,
  setStreaming: (v) => set({ streaming: v }),

  // Auth dialog
  authOpen: false,
  setAuthOpen: (v) => set({ authOpen: v }),
}));

// ── Theme Helper ──
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.classList.remove('dark');
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

// Initialize theme from localStorage on store creation
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('fishai-theme-mode') as ThemeMode | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setTimeout(() => {
        useAppStore.setState({ themeMode: saved });
      }, 0);
    }
  } catch {}
}