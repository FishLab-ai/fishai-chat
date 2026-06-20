'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Fish, ArrowRight, BookOpen } from 'lucide-react';
import { useAppStore, type UserInfo } from '@/lib/store';
import { API_BASE } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = name + '=; Path=/; Max-Age=0';
}

export default function HomePage() {
  const { initAuth, setUser } = useAppStore();

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
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
          <Fish className="w-8 h-8 text-white" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            FishAI
          </h1>
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            FishLab-ai 自研 AI 助手
          </p>
        </div>

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
    </div>
  );
}