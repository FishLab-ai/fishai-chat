'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Fish, ArrowRight, BookOpen, User, Settings, LogOut, ArrowLeftRight, Trash2 } from 'lucide-react';
import { useAppStore, type UserInfo } from '@/lib/store';
import { API_BASE } from '@/lib/api';
import { AuthDialog } from '@/components/auth-dialog';
import { UserProfileDialog } from '@/components/user-profile-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = name + '=; Path=/; Max-Age=0';
}

export default function HomePage() {
  const { initAuth, setUser, user, logout } = useAppStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Handle GitHub OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('gh_auth') === '1') {
      const cookieVal = getCookie('fishai-github-user');
      if (cookieVal) {
        fetch(`${API_BASE}/api/auth/github/decrypt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encrypted: cookieVal }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.id) {
              setUser(data as UserInfo);
              toast({ title: 'GitHub 登录成功' });
            } else {
              toast({ title: 'GitHub 登录失败', variant: 'destructive' });
            }
          })
          .catch(() => {
            toast({ title: 'GitHub 登录失败', variant: 'destructive' });
          })
          .finally(() => {
            deleteCookie('fishai-github-user');
          });
      }
      params.delete('gh_auth');
      const cleanUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

    const ghError = params.get('gh_error');
    if (ghError) {
      const errorMessages: Record<string, string> = {
        unconfigured: 'GitHub OAuth 未配置',
        no_code: '授权码缺失',
        token_failed: '获取令牌失败',
        no_user: '获取用户信息失败',
        no_email: '无法获取 GitHub 邮箱，请确保邮箱已公开',
        csrf_invalid: '安全校验失败，请重试',
        server_error: '服务器错误',
      };
      toast({
        title: errorMessages[ghError] || 'GitHub 登录失败',
        variant: 'destructive',
      });
      params.delete('gh_error');
      const cleanUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [setUser]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Floating login - top right */}
      <div className="fixed top-4 right-4 z-30">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow duration-200 cursor-pointer">
                {(user.name || user.email)[0].toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{user.name || '用户'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                用户设置
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAuthOpen(true)} className="cursor-pointer">
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                切换账号
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="h-9 px-4 rounded-xl bg-white/70 dark:bg-neutral-800/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-700/30 text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300/50 dark:hover:border-emerald-600/30 transition-all duration-200 flex items-center gap-1.5 text-xs font-medium"
          >
            <User className="w-3.5 h-3.5" />
            登录
          </button>
        )}
      </div>

      {/* Center content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Fish className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              FishAI
            </h1>
            <p className="text-sm text-neutral-400 dark:text-neutral-500">
              FishLab-ai 自研 AI 助手
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="group inline-flex items-center gap-2 rounded-xl px-6 h-11 text-sm font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              开始聊天
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/docs"
              className="group inline-flex items-center gap-2 rounded-xl px-5 h-11 text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all duration-200 active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4" />
              文档
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 flex items-center justify-center text-[10px] text-neutral-300 dark:text-neutral-700 select-none">
        FishLab-ai · v0.0.1 Alpha
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
