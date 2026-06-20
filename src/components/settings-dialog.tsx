'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore, type ThemeMode } from '@/lib/store';
import { API_BASE } from '@/lib/api';
import {
  Sun,
  Moon,
  Monitor,
  Zap,
  Brain,
  Turtle,
  Plus,
  Trash2,
  Pencil,
  Check,
  StickyNote,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MemoryItem {
  id: string;
  type: 'persistent' | 'active';
  content: string;
  category: string;
  accessCount: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  personal: '个人信息',
  preference: '偏好',
  knowledge: '知识',
  schedule: '日程',
  general: '其他',
};

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'light', label: '浅色', icon: Sun },
  { key: 'dark', label: '深色', icon: Moon },
  { key: 'system', label: '跟随系统', icon: Monitor },
];

const MEMORY_MODES: { key: 'aggressive' | 'balanced' | 'passive'; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { key: 'aggressive', label: '积极', icon: Zap, desc: '更频繁地记住信息' },
  { key: 'balanced', label: '平衡', icon: Brain, desc: '自然积累记忆' },
  { key: 'passive', label: '被动', icon: Turtle, desc: '较少主动记忆' },
];

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, themeMode, setThemeMode, memoryMode, setMemoryMode, user } = useAppStore();

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [memLoading, setMemLoading] = useState(false);
  const [memTab, setMemTab] = useState<'active' | 'persistent'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');

  const fetchMemories = useCallback(async () => {
    if (!user) return;
    setMemLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/memory?userId=${user.id}&type=${memTab}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch {
      // Ignore
    } finally {
      setMemLoading(false);
    }
  }, [user, memTab]);

  useEffect(() => {
    if (settingsOpen) fetchMemories();
  }, [settingsOpen, fetchMemories]);

  const handleCreate = async () => {
    if (!user) return;
    const content = newContent.trim();
    if (!content) {
      toast({ title: '请输入内容', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type: memTab, content, category: newCategory }),
      });
      if (res.ok) {
        setCreating(false);
        setNewContent('');
        setNewCategory('general');
        fetchMemories();
      }
    } catch {
      toast({ title: '创建失败', variant: 'destructive' });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/memory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: editContent }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchMemories();
      }
    } catch {
      toast({ title: '保存失败', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/memory?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (editingId === id) setEditingId(null);
        fetchMemories();
      }
    } catch {
      toast({ title: '删除失败', variant: 'destructive' });
    }
  };

  const activeMemories = memories.filter((m) => m.type === 'active');
  const persistentMemories = memories.filter((m) => m.type === 'persistent');
  const displayMemories = memTab === 'active' ? activeMemories : persistentMemories;

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>自定义 FishAI 的外观和行为</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* ── Theme ── */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">外观</h3>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = themeMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setThemeMode(opt.key)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500'}`} />
                    <span className={`text-xs font-medium ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Memory Frequency ── */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">记忆频率</h3>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-3">控制 AI 主动记住信息的积极程度</p>
            <div className="space-y-1.5">
              {MEMORY_MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = memoryMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    onClick={() => setMemoryMode(mode.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500'}`} />
                    <div className="text-left">
                      <span className={`text-xs font-medium ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                        {mode.label}
                      </span>
                      <span className={`text-[10px] ml-1.5 ${isActive ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-neutral-400 dark:text-neutral-500'}`}>
                        {mode.desc}
                      </span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Active Memories ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">记忆本</h3>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">查看和管理你的记忆</p>
              </div>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCreating(true); setNewContent(''); setNewCategory('general'); }}
                  className="h-7 w-7 p-0 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                  disabled={creating}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>

            {!user ? (
              <div className="py-8 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-400 dark:text-neutral-600">登录后使用记忆</p>
              </div>
            ) : (
              <>
                <div className="flex gap-1 mb-3">
                  <button
                    onClick={() => { setMemTab('active'); setCreating(false); setEditingId(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      memTab === 'active'
                        ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                        : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                    }`}
                  >
                    <StickyNote className="w-3 h-3" />
                    主动记忆
                  </button>
                  <button
                    onClick={() => { setMemTab('persistent'); setCreating(false); setEditingId(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      memTab === 'persistent'
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                        : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                    }`}
                  >
                    <Brain className="w-3 h-3" />
                    持久记忆
                  </button>
                </div>

                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mb-2">
                  {memTab === 'active'
                    ? '你主动记下的内容，所有对话立即可见'
                    : '自然积累的记忆，多提几次就记住了'}
                </div>

                {creating && (
                  <div className={`rounded-xl border p-3 space-y-2 mb-2 ${
                    memTab === 'active'
                      ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-950/20'
                      : 'border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/20'
                  }`}>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="text-xs bg-transparent border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5 text-neutral-600 dark:text-neutral-400"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder={memTab === 'active' ? '写一条主动记忆...' : '记一条持久记忆...'}
                      rows={3}
                      className="w-full text-xs bg-transparent border-none outline-none resize-none placeholder:text-neutral-400 text-neutral-600 dark:text-neutral-400 leading-relaxed"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="h-6 text-[11px] text-neutral-400" onClick={() => setCreating(false)}>
                        取消
                      </Button>
                      <Button size="sm" className={`h-6 text-[11px] text-white ${memTab === 'active' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-amber-500 hover:bg-amber-600'}`} onClick={handleCreate}>
                        保存
                      </Button>
                    </div>
                  </div>
                )}

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {memLoading && displayMemories.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-neutral-400">加载中...</p>
                    </div>
                  ) : displayMemories.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-neutral-400 dark:text-neutral-600">
                        {memTab === 'active' ? '还没有主动记忆' : '还没有持久记忆'}
                      </p>
                      <p className="text-[10px] text-neutral-300 dark:text-neutral-700 mt-1">
                        {memTab === 'active' ? '点 + 新建，或让 AI 帮你记' : '多聊几次，AI 自然会记住'}
                      </p>
                    </div>
                  ) : (
                    displayMemories.map((mem) => (
                      <div
                        key={mem.id}
                        className="group rounded-xl border border-neutral-200/60 dark:border-neutral-800/40 bg-white dark:bg-neutral-800/30 p-3 transition-all duration-150 hover:border-neutral-300 dark:hover:border-neutral-700/60"
                      >
                        {editingId === mem.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                              className="w-full text-xs bg-transparent border-none outline-none resize-none text-neutral-600 dark:text-neutral-400 leading-relaxed"
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <Button variant="ghost" size="sm" className="h-6 text-[11px] text-neutral-400" onClick={() => setEditingId(null)}>
                                取消
                              </Button>
                              <Button size="sm" className="h-6 text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleUpdate(mem.id)}>
                                <Check className="w-3 h-3 mr-1" />
                                保存
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                                  memTab === 'active'
                                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400'
                                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400'
                                }`}>
                                  {CATEGORY_LABELS[mem.category] || mem.category}
                                </span>
                                {mem.accessCount >= 3 && memTab === 'persistent' && (
                                  <span className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">牢固</span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => { setEditingId(mem.id); setEditContent(mem.content); }}
                                  className="h-5 w-5 rounded flex items-center justify-center text-neutral-300 dark:text-neutral-600 hover:text-emerald-500 transition-all"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(mem.id)}
                                  className="h-5 w-5 rounded flex items-center justify-center text-neutral-300 dark:text-neutral-600 hover:text-red-500 transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                              {mem.content}
                            </p>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}