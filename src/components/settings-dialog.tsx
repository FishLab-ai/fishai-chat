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
  Globe,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useI18n, type Locale, type Translations } from '@/lib/i18n';

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

/* eslint-disable max-lines-per-function */
function useNotesCRUD(user: UserInfo | null, t: Translations) {
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
      toast({ title: t.settings.contentRequired, variant: 'destructive' });
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
      toast({ title: t.settings.createFailed, variant: 'destructive' });
    }
  }, [user, newContent, newCategory, newPinned, fetchNotes, t]);

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
      toast({ title: t.settings.saveFailed, variant: 'destructive' });
    }
  }, [editContent, fetchNotes, t]);

  const handleTogglePin = useCallback(async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/memory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pinned: !currentPinned }),
      });
      if (res.ok) {
        fetchNotes();
        toast({ title: currentPinned ? t.settings.unpinned : t.settings.pinned });
      }
    } catch {
      toast({ title: t.settings.togglePinFailed, variant: 'destructive' });
    }
  }, [fetchNotes, t]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/memory?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEditingId((prev) => prev === id ? null : prev);
        fetchNotes();
      }
    } catch {
      toast({ title: t.settings.deleteFailed, variant: 'destructive' });
    }
  }, [fetchNotes, t]);

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
  t,
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
  t: Translations;
}) {
  const isEditing = editingId === note.id;

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      personal: t.settings.categories.personal,
      preference: t.settings.categories.preference,
      knowledge: t.settings.categories.knowledge,
      schedule: t.settings.categories.schedule,
      general: t.settings.categories.general,
    };
    return map[cat] || cat;
  };

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
              {t.common.cancel}
            </Button>
            <Button size="sm" className="h-6 text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => onEditSave(note.id)}>
              <Check className="w-3 h-3 mr-1" />
              {t.common.save}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400">
                {getCategoryLabel(note.category)}
              </span>
              {note.pinned && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                  <Pin className="w-2 h-2" />
                  {t.common.important}
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
                title={note.pinned ? t.settings.unpinned : t.settings.pinned}
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
  t,
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
  t: Translations;
}) {
  if (notesLoading && notes.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-neutral-400">{t.common.loading}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-neutral-400 dark:text-neutral-600">{t.settings.notebookEmpty}</p>
        <p className="text-[10px] text-neutral-300 dark:text-neutral-700 mt-1">
          {t.settings.notebookEmptyHint}
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
          t={t}
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
  t,
}: {
  newCategory: string;
  newPinned: boolean;
  newContent: string;
  onCategoryChange: (v: string) => void;
  onPinnedToggle: () => void;
  onContentChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
  t: Translations;
}) {
  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      personal: t.settings.categories.personal,
      preference: t.settings.categories.preference,
      knowledge: t.settings.categories.knowledge,
      schedule: t.settings.categories.schedule,
      general: t.settings.categories.general,
    };
    return map[cat] || cat;
  };

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 space-y-2 mb-2">
      <div className="flex items-center gap-2">
        <select
          value={newCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-xs bg-transparent border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5 text-neutral-600 dark:text-neutral-400"
        >
          {Object.entries({ personal: '', preference: '', knowledge: '', schedule: '', general: '' } as Record<string, string>).map(([k]) => (
            <option key={k} value={k}>{getCategoryLabel(k)}</option>
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
          {newPinned ? t.common.important : t.common.normal}
        </button>
      </div>
      <textarea
        value={newContent}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder={t.settings.notePlaceholder}
        rows={3}
        className="w-full text-xs bg-transparent border-none outline-none resize-none placeholder:text-neutral-400 text-neutral-600 dark:text-neutral-400 leading-relaxed"
        autoFocus
      />
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" className="h-6 text-[11px] text-neutral-400" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button size="sm" className="h-6 text-[11px] text-white bg-emerald-500 hover:bg-emerald-600" onClick={onSave}>
          {t.common.save}
        </Button>
      </div>
    </div>
  );
}

/* eslint-disable max-lines-per-function */
export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen, themeMode, setThemeMode, memoryMode, setMemoryMode, user } = useAppStore();
  const { t, locale, setLocale } = useI18n();

  const notesState = useNotesCRUD(user, t);

  // Fetch notes when dialog opens
  useEffect(() => {
    if (settingsOpen) {
      notesState.fetchNotes();
    }
  }, [settingsOpen, notesState.fetchNotes]); // eslint-disable-line react-hooks/exhaustive-deps

  const themeOptions: { key: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'light', label: t.settings.light, icon: Sun },
    { key: 'dark', label: t.settings.dark, icon: Moon },
    { key: 'system', label: t.settings.system, icon: Monitor },
  ];

  const memoryModes: { key: 'aggressive' | 'balanced' | 'passive'; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    { key: 'aggressive', label: t.settings.aggressive, icon: Zap, desc: t.settings.aggressiveDesc },
    { key: 'balanced', label: t.settings.balanced, icon: Brain, desc: t.settings.balancedDesc },
    { key: 'passive', label: t.settings.passive, icon: Turtle, desc: t.settings.passiveDesc },
  ];

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.settings.title}</DialogTitle>
          <DialogDescription>{t.settings.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* ── Language ── */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              <Globe className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {t.settings.language}
            </h3>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-3">{t.settings.languageDescription}</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'zh-CN' as Locale, label: t.settings.zhCN },
                { key: 'zh-TW' as Locale, label: t.settings.zhTW },
                { key: 'en-US' as Locale, label: t.settings.enUS },
              ]).map((opt) => {
                const isActive = locale === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setLocale(opt.key)}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                      {opt.label}
                    </span>
                    {isActive && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Theme ── */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">{t.settings.appearance}</h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => {
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
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">{t.settings.memoryFrequency}</h3>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-3">{t.settings.memoryDescription}</p>
            <div className="space-y-1.5">
              {memoryModes.map((mode) => {
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
                  {t.settings.notebook}
                </h3>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">{t.settings.notebookDescription}</p>
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
                <p className="text-xs text-neutral-400 dark:text-neutral-600">{t.settings.loginToUseNotebook}</p>
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
                    t={t}
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
                  t={t}
                />
              </>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}