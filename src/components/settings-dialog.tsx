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
import { useAppStore, type ThemeMode, type UserInfo } from '@/lib/store';
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
  BookMarked,
  Pin,
  PinOff,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface NoteItem {
  id: string;
  type: string;
  content: string;
  category: string;
  pinned: boolean;
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

/* eslint-disable max-lines-per-function */
function useNotesCRUD(user: UserInfo | null) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPinned, setNewPinned] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user) {return;}
    setNotesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/memory?userId=${user.id}&type=active`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data as NoteItem[]);
      }
    } catch {
      // Ignore
    } finally {
      setNotesLoading(false);
    }
  }, [user]);

  const handleCreate = useCallback(async () => {
    if (!user) {return;}
    const content = newContent.trim();
    if (!content) {
      toast({ title: '请输入内容', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type: 'active', content, category: newCategory, pinned: newPinned }),
      });
      if (res.ok) {
        setCreating(false);
        setNewContent('');
        setNewCategory('general');
        setNewPinned(false);
        fetchNotes();
      }
    } catch {
      toast({ title: '创建失败', variant: 'destructive' });
    }
  }, [user, newContent, newCategory, newPinned, fetchNotes]);

  const handleUpdate = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/memory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: editContent }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchNotes();
      }
    } catch {
      toast({ title: '保存失败', variant: 'destructive' });
    }
  }, [editContent, fetchNotes]);

  const handleTogglePin = useCallback(async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/memory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pinned: !currentPinned }),
      });
      if (res.ok) {
        fetchNotes();
        toast({ title: currentPinned ? '已取消标记' : '已标记为重要' });
      }
    } catch {
      toast({ title: '操作失败', variant: 'destructive' });
    }
  }, [fetchNotes]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/memory?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEditingId((prev) => prev === id ? null : prev);
        fetchNotes();
      }
    } catch {
      toast({ title: '删除失败', variant: 'destructive' });
    }
  }, [fetchNotes]);

  return {
    notes, notesLoading, editingId, editContent, creating,
    newContent, newCategory, newPinned,
    setEditingId, setEditContent, setCreating, setNewContent, setNewCategory, setNewPinned,
    fetchNotes, handleCreate, handleUpdate, handleTogglePin, handleDelete,
  };
}

/* eslint-disable max-lines-per-function */
function NoteCard({
  note,
  editingId,
  editContent,
  onEditStart,
  onEditCancel,
  onEditContentChange,
  onEditSave,
  onTogglePin,
  onDelete,
}: {
  note: NoteItem;
  editingId: string | null;
  editContent: string;
  onEditStart: (id: string, content: string) => void;
  onEditCancel: () => void;
  onEditContentChange: (v: string) => void;
  onEditSave: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const isEditing = editingId === note.id;

  return (
    <div
      className={`group rounded-xl border p-3 transition-all duration-150 hover:border-neutral-300 dark:hover:border-neutral-700/60 ${
        note.pinned
          ? 'border-amber-200/60 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10'
          : 'border-neutral-200/60 dark:border-neutral-800/40 bg-white dark:bg-neutral-800/30'
      }`}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            rows={3}
            className="w-full text-xs bg-transparent border-none outline-none resize-none text-neutral-600 dark:text-neutral-400 leading-relaxed"
          />
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-neutral-400" onClick={onEditCancel}>
              取消
            </Button>
            <Button size="sm" className="h-6 text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => onEditSave(note.id)}>
              <Check className="w-3 h-3 mr-1" />
              保存
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400">
                {CATEGORY_LABELS[note.category] || note.category}
              </span>
              {note.pinned && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                  <Pin className="w-2 h-2" />
                  重要
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onTogglePin(note.id, note.pinned)}
                className={`h-5 w-5 rounded flex items-center justify-center transition-all ${
                  note.pinned
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-neutral-300 dark:text-neutral-600 hover:text-amber-500'
                }`}
                title={note.pinned ? '取消重要' : '标记为重要'}
              >
                <Pin className="w-3 h-3" />
              </button>
              <button
                onClick={() => onEditStart(note.id, note.content)}
                className="h-5 w-5 rounded flex items-center justify-center text-neutral-300 dark:text-neutral-600 hover:text-emerald-500 transition-all"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="h-5 w-5 rounded flex items-center justify-center text-neutral-300 dark:text-neutral-600 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {note.content}
          </p>
        </>
      )}
    </div>
  );
}

function NotesList({
  notes,
  notesLoading,
  editingId,
  editContent,
  setEditingId,
  setEditContent,
  onEditSave,
  onTogglePin,
  onDelete,
}: {
  notes: NoteItem[];
  notesLoading: boolean;
  editingId: string | null;
  editContent: string;
  setEditingId: (v: string | null) => void;
  setEditContent: (v: string) => void;
  onEditSave: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (notesLoading && notes.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-neutral-400">加载中...</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-neutral-400 dark:text-neutral-600">记事本是空的</p>
        <p className="text-[10px] text-neutral-300 dark:text-neutral-700 mt-1">
          点 + 新建笔记，或让 AI 帮你记
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-60 overflow-y-auto space-y-2">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          editingId={editingId}
          editContent={editContent}
          onEditStart={(id, content) => { setEditingId(id); setEditContent(content); }}
          onEditCancel={() => setEditingId(null)}
          onEditContentChange={setEditContent}
          onEditSave={onEditSave}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function CreateNoteForm({
  newCategory,
  newPinned,
  newContent,
  onCategoryChange,
  onPinnedToggle,
  onContentChange,
  onCancel,
  onSave,
}: {
  newCategory: string;
  newPinned: boolean;
  newContent: string;
  onCategoryChange: (v: string) => void;
  onPinnedToggle: () => void;
  onContentChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 space-y-2 mb-2">
      <div className="flex items-center gap-2">
        <select
          value={newCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-xs bg-transparent border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5 text-neutral-600 dark:text-neutral-400"
        >
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onPinnedToggle}
          className={`inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-all border ${
            newPinned
              ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              : 'border-neutral-200 dark:border-neutral-700 text-neutral-400'
          }`}
        >
          {newPinned ? <Pin className="w-2.5 h-2.5" /> : <PinOff className="w-2.5 h-2.5" />}
          {newPinned ? '重要' : '普通'}
        </button>
      </div>
      <textarea
        value={newContent}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="写一条笔记..."
        rows={3}
        className="w-full text-xs bg-transparent border-none outline-none resize-none placeholder:text-neutral-400 text-neutral-600 dark:text-neutral-400 leading-relaxed"
        autoFocus
      />
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" className="h-6 text-[11px] text-neutral-400" onClick={onCancel}>
          取消
        </Button>
        <Button size="sm" className="h-6 text-[11px] text-white bg-emerald-500 hover:bg-emerald-600" onClick={onSave}>
          保存
        </Button>
      </div>
    </div>
  );
}

/* eslint-disable max-lines-per-function */
export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, themeMode, setThemeMode, memoryMode, setMemoryMode, user } = useAppStore();

  const notesState = useNotesCRUD(user);

  // Fetch notes when dialog opens
  useEffect(() => {
    if (settingsOpen) {
      notesState.fetchNotes();
    }
  }, [settingsOpen, notesState.fetchNotes]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-3">控制 AI 记住信息的积极程度，聊得越多它越记得牢</p>
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

          {/* ── Notebook ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <BookMarked className="w-4 h-4" />
                  记事本
                </h3>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">跨所有对话 · 重要的直接注入，普通的留给AI检索</p>
              </div>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { notesState.setCreating(true); notesState.setNewContent(''); notesState.setNewCategory('general'); notesState.setNewPinned(false); }}
                  className="h-7 w-7 p-0 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                  disabled={notesState.creating}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>

            {!user ? (
              <div className="py-8 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-neutral-400 dark:text-neutral-600">登录后使用记事本</p>
              </div>
            ) : (
              <>
                {notesState.creating && (
                  <CreateNoteForm
                    newCategory={notesState.newCategory}
                    newPinned={notesState.newPinned}
                    newContent={notesState.newContent}
                    onCategoryChange={notesState.setNewCategory}
                    onPinnedToggle={() => notesState.setNewPinned(!notesState.newPinned)}
                    onContentChange={notesState.setNewContent}
                    onCancel={() => notesState.setCreating(false)}
                    onSave={notesState.handleCreate}
                  />
                )}

                <NotesList
                  notes={notesState.notes}
                  notesLoading={notesState.notesLoading}
                  editingId={notesState.editingId}
                  editContent={notesState.editContent}
                  setEditingId={notesState.setEditingId}
                  setEditContent={notesState.setEditContent}
                  onEditSave={notesState.handleUpdate}
                  onTogglePin={notesState.handleTogglePin}
                  onDelete={notesState.handleDelete}
                />
              </>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
