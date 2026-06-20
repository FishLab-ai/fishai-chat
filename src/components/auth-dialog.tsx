'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, type UserInfo } from '@/lib/store';
import { API_BASE } from '@/lib/api';
import { Fish, Loader2, Github } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { setUser } = useAppStore();

  const [githubEnabled, setGithubEnabled] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    if (open) {
      fetch(`${API_BASE}/api/auth/github/config`)
        .then((r) => r.json())
        .then((data) => {
          setGithubEnabled(data.enabled === true);
          setConfigLoaded(true);
        })
        .catch(() => {
          setGithubEnabled(false);
          setConfigLoaded(true);
        });
    }
  }, [open]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast({ title: '请填写邮箱和密码', variant: 'destructive' });
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || '登录失败', variant: 'destructive' });
        return;
      }
      setUser(data as UserInfo);
      toast({ title: '登录成功' });
      onOpenChange(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch {
      toast({ title: '网络错误', variant: 'destructive' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regEmail || !regPassword) {
      toast({ title: '请填写邮箱和密码', variant: 'destructive' });
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword, name: regName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || '注册失败', variant: 'destructive' });
        return;
      }
      setUser(data as UserInfo);
      toast({ title: '注册成功' });
      onOpenChange(false);
      setRegEmail('');
      setRegPassword('');
      setRegName('');
    } catch {
      toast({ title: '网络错误', variant: 'destructive' });
    } finally {
      setRegLoading(false);
    }
  };

  const handleGithubLogin = () => {
    window.location.href = `${API_BASE}/api/auth/github`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Fish className="w-4 h-4 text-white" />
            </div>
            FishAI 账号
          </DialogTitle>
          <DialogDescription>登录或注册以保存对话历史</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">邮箱</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">密码</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              登录
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">昵称（可选）</Label>
              <Input
                id="reg-name"
                placeholder="FishAI 用户"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">邮箱</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="your@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">密码</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              />
            </div>
            <Button
              onClick={handleRegister}
              disabled={regLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              {regLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              注册
            </Button>
          </TabsContent>
        </Tabs>

        {configLoaded && githubEnabled && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-200 dark:border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-400 dark:text-neutral-500">
                  第三方登录
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleGithubLogin}
              className="w-full flex items-center justify-center gap-2 h-10"
            >
              <Github className="w-4 h-4" />
              GitHub 一键登录
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}