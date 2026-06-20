'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore, type UserInfo } from '@/lib/store';
import { API_BASE } from '@/lib/api';
import { Pencil, Check, Loader2, Github, Link2, Unlink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user, setUser } = useAppStore();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // GitHub binding status
  const [githubBound, setGithubBound] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubConfigEnabled, setGithubConfigEnabled] = useState(false);

  // Account deletion
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchGithubStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/github/config`);
      if (res.ok) {
        const data = await res.json();
        setGithubConfigEnabled(data.enabled === true);
      }
    } catch {
      // Ignore
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      setNameValue(user.name || '');
      setEditingName(false);
      setDeleteConfirming(false);
      // Check if user has GitHub bound (githubId is non-null on user)
      // For now, infer from a future API call
      setGithubBound(!!(user as Record<string, unknown>).githubId);
      fetchGithubStatus();
    }
  }, [open, user, fetchGithubStatus]);

  const handleSaveName = async () => {
    if (!user) return;
    const newName = nameValue.trim();
    if (!newName) {
      toast({ title: '昵称不能为空', variant: 'destructive' });
      return;
    }
    setNameLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name: newName }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: data.error || '修改失败', variant: 'destructive' });
        return;
      }
      const data = await res.json();
      setUser(data as UserInfo);
      setEditingName(false);
      toast({ title: '昵称已更新' });
    } catch {
      toast({ title: '网络错误', variant: 'destructive' });
    } finally {
      setNameLoading(false);
    }
  };

  const handleGithubBind = () => {
    // Redirect to GitHub OAuth, then come back and check binding status
    window.location.href = `${API_BASE}/api/auth/github`;
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!deleteConfirming) {
      setDeleteConfirming(true);
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: data.error || '注销失败', variant: 'destructive' });
        return;
      }
      toast({ title: '账号已注销' });
      // Clear local state and redirect
      const { logout } = useAppStore.getState();
      logout();
      onOpenChange(false);
    } catch {
      toast({ title: '网络错误', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setDeleteConfirming(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>用户设置</DialogTitle>
          <DialogDescription>管理你的账号信息和偏好</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* ── Avatar & Name ── */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">个人信息</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-emerald-500/20 shrink-0">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveName}
                      disabled={nameLoading}
                      className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                    >
                      {nameLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {user.name || '未设置昵称'}
                    </span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors shrink-0"
                      title="修改昵称"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">{user.email}</p>
              </div>
            </div>
          </section>

          {/* ── Third-party Login Binding ── */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">第三方登录</h3>
            <div className="space-y-2">
              {githubConfigEnabled ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800/40 bg-white dark:bg-neutral-800/30">
                  <div className="flex items-center gap-2.5">
                    <Github className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <div>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">GitHub</span>
                      {githubBound && githubUsername && (
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-1.5">
                          @{githubUsername}
                        </span>
                      )}
                    </div>
                  </div>
                  {githubBound ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <Link2 className="w-2.5 h-2.5" />
                      已绑定
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGithubBind}
                      disabled={githubLoading}
                      className="h-7 text-xs text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                    >
                      {githubLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      绑定
                    </Button>
                  )}
                </div>
              ) : null}

              {!githubConfigEnabled && (
                <div className="py-4 text-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs text-neutral-400 dark:text-neutral-600">
                    暂无可用的第三方登录服务
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Danger Zone ── */}
          <section>
            <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 mb-3">危险操作</h3>
            {deleteConfirming ? (
              <div className="p-3 rounded-xl border-2 border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 space-y-3">
                <p className="text-xs text-red-600 dark:text-red-400">
                  确定要注销账号吗？此操作将永久删除你的所有数据，包括对话记录和记忆，且无法恢复。
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="h-8 text-xs"
                  >
                    {deleteLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    确认注销
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirming(false)}
                    className="h-8 text-xs text-neutral-500"
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={handleDeleteAccount}
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-9 text-xs"
              >
                <Unlink className="w-3.5 h-3.5 mr-2" />
                注销账号
              </Button>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
