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

function useGithubConfig(open: boolean) {
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
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
  }, [open]);

  return { githubEnabled, configLoaded };
}

function useLoginForm(setUser: (user: UserInfo) => void, onClose: () => void) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

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
      onClose();
      setLoginEmail('');
      setLoginPassword('');
    } catch {
      toast({ title: '网络错误', variant: 'destructive' });
    } finally {
      setLoginLoading(false);
    }
  };

  return { loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginLoading, handleLogin };
}

function useRegisterForm(setUser: (user: UserInfo) => void, onClose: () => void) {
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regLoading, setRegLoading] = useState(false);

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
      onClose();
      setRegEmail('');
      setRegPassword('');
      setRegName('');
    } catch {
      toast({ title: '网络错误', variant: 'destructive' });
    } finally {
      setRegLoading(false);
    }
  };

  return { regEmail, setRegEmail, regPassword, setRegPassword, regName, setRegName, regLoading, handleRegister };
}

/* eslint-disable max-lines-per-function */
export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { setUser } = useAppStore();
  const { githubEnabled, configLoaded } = useGithubConfig(open);

  const handleClose = () => onOpenChange(false);
  const loginForm = useLoginForm(setUser, handleClose);
  const registerForm = useRegisterForm(setUser, handleClose);

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
                value={loginForm.loginEmail}
                onChange={(e) => loginForm.setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loginForm.handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">密码</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginForm.loginPassword}
                onChange={(e) => loginForm.setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loginForm.handleLogin()}
              />
            </div>
            <Button
              onClick={loginForm.handleLogin}
              disabled={loginForm.loginLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              {loginForm.loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              登录
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">昵称（可选）</Label>
              <Input
                id="reg-name"
                placeholder="FishAI 用户"
                value={registerForm.regName}
                onChange={(e) => registerForm.setRegName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">邮箱</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="your@email.com"
                value={registerForm.regEmail}
                onChange={(e) => registerForm.setRegEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">密码</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={registerForm.regPassword}
                onChange={(e) => registerForm.setRegPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && registerForm.handleRegister()}
              />
            </div>
            <Button
              onClick={registerForm.handleRegister}
              disabled={registerForm.regLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
            >
              {registerForm.regLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
              onClick={() => {
                window.location.href = `${API_BASE}/api/auth/github`;
              }}
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
