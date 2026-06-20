'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, type ConversationItem, type UserInfo } from '@/lib/store';
import { API_BASE } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Trash2,
  X,
  LogOut,
  Github,
  Home,
  BookOpen,
  Settings,
  User,
  ArrowLeftRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

function ConversationList({
  user,
  loading,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
}: {
  user: UserInfo | null;
  loading: boolean;
  conversations: ConversationItem[];
  currentConversationId: string | null;
  onSelectConversation: (convId: string) => void;
  onDeleteConversation: (e: React.MouseEvent, convId: string) => void;
}) {
  if (!user) {
    return (
      <div className="px-3 py-10 text-center">
        <p className="text-xs text-neutral-400 dark:text-neutral-600">登录后查看聊天记录</p>
      </div>
    );
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="px-3 py-10 text-center">
        <p className="text-xs text-neutral-400">加载中...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="px-3 py-10 text-center">
        <p className="text-xs text-neutral-400 dark:text-neutral-600">暂无对话</p>
      </div>
    );
  }

  return (
    <div>
      {conversations.map((conv) => (
        <div
          key={conv.id}
          onClick={() => onSelectConversation(conv.id)}
          className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
            currentConversationId === conv.id
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
          <span className="flex-1 text-xs truncate">{conv.title}</span>
          <button
            onClick={(e) => onDeleteConversation(e, conv.id)}
            className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded-md flex items-center justify-center text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* eslint-disable max-lines-per-function */
export function Sidebar() {
  const router = useRouter();
  const {
    user,
    logout,
    conversations,
    setConversations,
    currentConversationId,
    setCurrentConversationId,
    setMessages,
    sidebarOpen,
    setSidebarOpen,
    setSettingsOpen,
    setAuthOpen,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) {return;}
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/conversations?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data as ConversationItem[]);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [user, setConversations]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (sidebarOpen) {
      fetchConversations();
      setClosing(false);
    }
  }, [sidebarOpen, fetchConversations]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setSidebarOpen(false);
      setClosing(false);
    }, 200);
  }, [setSidebarOpen]);

  const handleSelectConversation = async (convId: string) => {
    setCurrentConversationId(convId);
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${convId}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(
          msgs.map((m: { id: string; role: string; content: string; thinking: string | null; searchResults: string | null; createdAt: string }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            thinking: m.thinking,
            searchResults: m.searchResults,
            createdAt: m.createdAt,
          }))
        );
      }
    } catch {
      // Ignore
    }
    handleClose();
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!user) {return;}
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, userId: user.id }),
      });
      if (res.ok) {
        if (currentConversationId === convId) {
          setCurrentConversationId(null);
          setMessages([]);
        }
        fetchConversations();
      }
    } catch {
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  if (!sidebarOpen && !closing) {return null;}

  return (
    <>
      <div
        className="fixed inset-0 bg-black/15 dark:bg-black/30 z-30 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={handleClose}
        style={{ opacity: closing ? 0 : 1 }}
      />

      <div
        className={`fixed left-0 top-0 bottom-0 w-72 z-40 bg-white dark:bg-neutral-900 border-r border-neutral-200/80 dark:border-neutral-800/60 shadow-2xl flex flex-col ${
          closing ? 'sidebar-exit' : 'sidebar-enter'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-200/60 dark:border-neutral-800/40 shrink-0">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">聊天记录</span>
          <button
            onClick={handleClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            <ConversationList
              user={user}
              loading={loading}
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          </div>
        </ScrollArea>

        <div className="p-3 space-y-3 border-t border-neutral-200/60 dark:border-neutral-800/40">
          {user ? (
            <DropdownMenu>
              <div className="flex items-center gap-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-2.5">
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 px-1 py-0.5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{user.name || user.email}</span>
                  </button>
                </DropdownMenuTrigger>
                <button
                  onClick={() => { setSettingsOpen(true); handleClose(); }}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors shrink-0"
                  title="设置"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <DropdownMenuContent align="start" side="top" className="w-48 mb-1">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name || '用户'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setAuthOpen(true); }} className="cursor-pointer">
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  换个账号
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-2.5">
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 px-1 py-0.5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">登录</span>
              </button>
              <button
                onClick={() => { setSettingsOpen(true); handleClose(); }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors shrink-0"
                title="设置"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => { router.push('/'); handleClose(); }}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="首页"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={() => { router.push('/docs'); handleClose(); }}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="文档"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <a
              href="https://github.com/FishLab-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
