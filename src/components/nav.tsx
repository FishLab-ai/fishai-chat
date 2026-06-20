'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fish, MessageSquare, BookOpen, User, Github } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AuthDialog } from '@/components/auth-dialog';

export function Nav() {
  const pathname = usePathname();
  const { user, authOpen, setAuthOpen } = useAppStore();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-neutral-100 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-shadow">
              <Fish className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">FishAI</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/chat"
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive('/chat')
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              聊天
            </Link>
            <Link
              href="/docs"
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive('/docs')
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              文档
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/FishLab-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
          {user ? (
            <Link
              href="/chat"
              className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-emerald-500/20"
            >
              {(user.name || user.email)[0].toUpperCase()}
            </Link>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              登录
            </button>
          )}
        </div>
      </header>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}