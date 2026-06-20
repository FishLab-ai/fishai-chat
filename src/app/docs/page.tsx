import type { Metadata } from "next";
import { Github, Fish, Palette, Server, Cloud, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "FishAI 文档 · FishLab-ai",
  description: "FishAI 项目文档 — 架构、设计语言、部署、API 速查",
};

const SECTIONS = [
  { id: "overview", label: "项目概览", icon: BookOpen },
  { id: "architecture", label: "仓库架构", icon: Fish },
  { id: "design-language", label: "设计语言", icon: Palette },
  { id: "deploy", label: "部署", icon: Cloud },
  { id: "api", label: "API 速查", icon: Server },
  { id: "github", label: "仓库地址", icon: Github },
];

export default function DocsPage() {
  return (
    <div className="flex-1 bg-background text-foreground overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-10 flex gap-10">
        <aside className="hidden md:block w-48 flex-shrink-0">
          <nav className="sticky top-20 space-y-1">
            <p className="px-3 mb-2 text-xs uppercase tracking-wider text-muted-foreground">目录</p>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight mb-2">FishAI 项目文档</h1>
          <p className="text-muted-foreground mb-10">
            FishLab-ai 自研 AI 助手 — Rust 推理引擎 + 4-bit 量化 + 领域块联想激活架构
          </p>

          <section id="overview" className="scroll-mt-20 mb-14">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              项目概览
            </h2>
            <p className="text-sm leading-7 mb-4">
              FishAI 是 FishLab-ai 组织自研的 AI 助手项目，目标是构建一个
              <strong className="text-foreground"> 轻量但聪明 </strong>
              的对话型 AI。与主流大模型不同，我们采用
              <strong className="text-foreground"> 领域块 + 联想激活 </strong>
              的小模型架构，每个领域块是独立的 50-60MB 文件，平均同时激活 5-6 个块，
              CPU 也能跑，不需要 GPU 也不需要 Git LFS。
            </p>
            <p className="text-sm leading-7 mb-4">
              整个项目按职责拆分为多个独立仓库：前端、后端、训练工具、权重各自独立，
              通过 HTTP API 解耦。这样的好处是每个仓库都可以独立部署、独立迭代，
              权重仓库可以单独 clone 到不同机器跑推理，前端可以静态部署到 CDN。
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              {[
                { k: "推理引擎", v: "Rust" },
                { k: "量化", v: "4-bit" },
                { k: "单权重", v: "50-60MB" },
                { k: "激活块", v: "Top 5-6" },
              ].map((x) => (
                <div key={x.k} className="rounded-lg border border-border bg-card p-3 text-center">
                  <div className="text-xs text-muted-foreground">{x.k}</div>
                  <div className="text-sm font-semibold mt-1">{x.v}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="architecture" className="scroll-mt-20 mb-14">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Fish className="w-5 h-5 text-primary" />
              仓库架构
            </h2>
            <p className="text-sm leading-7 mb-4">
              组织从原本混乱的单仓库结构，拆分为四个职责清晰的独立仓库。
              每个仓库有自己的 README、deploy 脚本和 CI 流程，可以独立部署和测试。
            </p>
            <div className="my-6 rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-12 bg-muted/60 px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border">
                <div className="col-span-3">仓库</div>
                <div className="col-span-2">类型</div>
                <div className="col-span-7">职责</div>
              </div>
              {[
                { repo: "fishai-web", type: "前端", duty: "纯 UI — Next.js + React 19 + shadcn/ui，调 fishai-server 的 API" },
                { repo: "fishai-server", type: "后端", duty: "API 服务 — Next.js API Routes + Prisma + SQLite，调推理引擎" },
                { repo: "fishai-train", type: "工具", duty: "命令行训练工具 — Rust，量化、领域块切分、联想激活训练" },
                { repo: "fishai-weights", type: "数据", duty: "权重仓库 — 50-60 个 .bin 文件，每个 50-60MB，不用 LFS" },
              ].map((r) => (
                <div
                  key={r.repo}
                  className="grid grid-cols-12 px-4 py-3 text-sm border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <div className="col-span-3 font-mono text-primary">{r.repo}</div>
                  <div className="col-span-2 text-muted-foreground">{r.type}</div>
                  <div className="col-span-7">{r.duty}</div>
                </div>
              ))}
            </div>
            <p className="text-sm leading-7">
              <strong className="text-foreground">调用链：</strong>
              <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-primary text-xs">User</code>
              →
              <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-primary text-xs">fishai-web</code>
              →
              <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-primary text-xs">fishai-server /api/chat</code>
              → 推理引擎
            </p>
          </section>

          <section id="design-language" className="scroll-mt-20 mb-14">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              设计语言：Deep Sea Lab
            </h2>
            <p className="text-sm leading-7 mb-4">
              设计代号 <strong className="text-foreground">Deep Sea Lab（深海实验室）</strong>。
              呼应 Fish（鱼/海洋）+ Lab（实验室精确感）+ Rust 引擎（金属/工业）。
              目标是让 FishAI 一眼可识别，区别于市面 AI 产品的蓝紫色调。
            </p>

            <h3 className="text-base font-semibold mt-6 mb-3">色彩系统</h3>
            <p className="text-sm leading-7 mb-3">
              采用 OKLCH 色彩空间（比 HSL 更精确，感知均匀）。主色为深海青蓝，
              浅色模式如海面（明亮、空气感），深色模式如深海（沉静、专注）。
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              {[
                { name: "Primary", light: "oklch(0.55 0.13 220)", dark: "oklch(0.72 0.13 200)", desc: "深海青蓝" },
                { name: "Background", light: "oklch(0.99 0.005 220)", dark: "oklch(0.16 0.015 230)", desc: "海面/深海" },
                { name: "Card", light: "oklch(1 0 0)", dark: "oklch(0.2 0.02 230)", desc: "卡片" },
                { name: "Muted", light: "oklch(0.96 0.01 220)", dark: "oklch(0.25 0.02 230)", desc: "次要背景" },
                { name: "Accent", light: "oklch(0.93 0.04 220)", dark: "oklch(0.3 0.04 220)", desc: "Hover 态" },
                { name: "Destructive", light: "oklch(0.6 0.22 25)", dark: "oklch(0.7 0.19 22)", desc: "珊瑚红" },
                { name: "Border", light: "oklch(0.92 0.01 220)", dark: "oklch(1 0 0 / 8%)", desc: "边框" },
                { name: "Foreground", light: "oklch(0.18 0.02 230)", dark: "oklch(0.96 0.005 220)", desc: "正文" },
              ].map((c) => (
                <div key={c.name} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md border border-border" style={{ background: c.light }} title={`Light: ${c.light}`} />
                    <div className="w-5 h-5 rounded-md border border-border" style={{ background: c.dark }} title={`Dark: ${c.dark}`} />
                  </div>
                  <div className="text-xs font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
                </div>
              ))}
            </div>

            <h3 className="text-base font-semibold mt-6 mb-3">禁用色</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Tailwind 默认 <code className="text-foreground">blue-500</code> — 太普通，和 ChatGPT/Claude 撞色</li>
              <li>• 纯紫色 / 紫蓝渐变 — 和很多 AI 产品撞</li>
              <li>• <code className="text-foreground">neutral-*</code> 灰阶硬编码 — 必须走 <code className="text-foreground">muted</code> / <code className="text-foreground">border</code> 变量</li>
            </ul>

            <h3 className="text-base font-semibold mt-6 mb-3">字体系统</h3>
            <div className="rounded-lg border border-border bg-card p-4 text-sm space-y-2">
              <div><span className="text-muted-foreground">Latin：</span>Geist（现代几何无衬线）</div>
              <div><span className="text-muted-foreground">中文：</span>Noto Sans SC（Google Fonts，开源，与 Geist 协调）</div>
              <div><span className="text-muted-foreground">等宽：</span>Geist Mono / JetBrains Mono（代码块）</div>
              <div><span className="text-muted-foreground">字重：</span>400 正文 / 500 次要强调 / 600 标题按钮 / 700 仅 Logo</div>
            </div>
          </section>

          <section id="deploy" className="scroll-mt-20 mb-14">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-primary" />
              部署
            </h2>
            <p className="text-sm leading-7 mb-4">
              每个仓库都自带一份通用的 <code className="text-foreground">deploy.sh</code>，
              适用于任何 Linux 服务器（不限沙箱）。脚本会自动检测 PM2 是否安装，
              装了用 PM2 守护，没装就 nohup 兜底。
            </p>

            <h3 className="text-base font-semibold mt-6 mb-3">fishai-server</h3>
            <pre className="rounded-xl border border-border bg-muted/40 overflow-x-auto p-4 text-[13px] leading-[1.65] font-mono">
{`# 克隆 + 部署（默认端口 3000）
git clone https://github.com/FishLab-ai/fishai-server.git
cd fishai-server
./deploy.sh

# 自定义端口
PORT=8080 ./deploy.sh

# 其他子命令
./deploy.sh stop | restart | status | logs | build`}
            </pre>

            <h3 className="text-base font-semibold mt-6 mb-3">fishai-web</h3>
            <pre className="rounded-xl border border-border bg-muted/40 overflow-x-auto p-4 text-[13px] leading-[1.65] font-mono">
{`# 克隆 + 部署（默认端口 3001）
git clone https://github.com/FishLab-ai/fishai-web.git
cd fishai-web
./deploy.sh

# 跨域调用后端（如果 server 在不同域名）
API_BASE_URL=https://api.example.com ./deploy.sh

# 同源模式（默认）：/api/* 由 Next.js rewrites 反代到 server`}
            </pre>

            <h3 className="text-base font-semibold mt-6 mb-3">守护策略</h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-12 bg-muted/60 px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border">
                <div className="col-span-3">环境</div>
                <div className="col-span-4">方式</div>
                <div className="col-span-5">说明</div>
              </div>
              <div className="grid grid-cols-12 px-4 py-3 text-sm border-b border-border">
                <div className="col-span-3 font-mono">装了 PM2</div>
                <div className="col-span-4 font-mono text-primary">pm2 start</div>
                <div className="col-span-5">自动 pm2 save，开机可恢复</div>
              </div>
              <div className="grid grid-cols-12 px-4 py-3 text-sm">
                <div className="col-span-3 font-mono">没装 PM2</div>
                <div className="col-span-4 font-mono text-primary">nohup 兜底</div>
                <div className="col-span-5">PID 存 .logs/，提示 npm i -g pm2</div>
              </div>
            </div>
          </section>

          <section id="api" className="scroll-mt-20 mb-14">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              API 速查
            </h2>
            <p className="text-sm leading-7 mb-4">
              fishai-server 暴露以下 API 路由，全部走 HTTP JSON。
              前端通过同源 <code className="text-foreground">/api/*</code> 反代访问（不需要 CORS）。
            </p>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-12 bg-muted/60 px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border">
                <div className="col-span-2">方法</div>
                <div className="col-span-5">路径</div>
                <div className="col-span-5">说明</div>
              </div>
              {[
                { m: "POST", p: "/api/auth/register", d: "注册（用户名 + 密码）" },
                { m: "POST", p: "/api/auth/login", d: "登录，返回 JWT" },
                { m: "GET", p: "/api/auth/github", d: "GitHub OAuth 入口" },
                { m: "GET", p: "/api/auth/github/callback", d: "GitHub OAuth 回调" },
                { m: "POST", p: "/api/chat", d: "流式聊天，SSE 返回" },
                { m: "GET", p: "/api/conversations", d: "获取会话列表" },
                { m: "GET", p: "/api/conversations/[id]/messages", d: "获取某会话所有消息" },
                { m: "POST", p: "/api/memory", d: "写入长期记忆" },
              ].map((r) => (
                <div
                  key={r.p}
                  className="grid grid-cols-12 px-4 py-2.5 text-sm border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <div className="col-span-2">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary">
                      {r.m}
                    </span>
                  </div>
                  <div className="col-span-5 font-mono text-xs">{r.p}</div>
                  <div className="col-span-5 text-muted-foreground">{r.d}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="github" className="scroll-mt-20 mb-14">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Github className="w-5 h-5 text-primary" />
              仓库地址
            </h2>
            <p className="text-sm leading-7 mb-4">
              所有仓库托管在 GitHub <strong className="text-foreground">FishLab-ai</strong> 组织下：
            </p>
            <div className="space-y-2">
              {[
                { name: "fishai-web", url: "https://github.com/FishLab-ai/fishai-web" },
                { name: "fishai-server", url: "https://github.com/FishLab-ai/fishai-server" },
                { name: "fishai-train", url: "https://github.com/FishLab-ai/fishai-train" },
                { name: "fishai-weights", url: "https://github.com/FishLab-ai/fishai-weights" },
              ].map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-colors"
                >
                  <span className="font-mono text-sm text-primary">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.url}</span>
                </a>
              ))}
            </div>
          </section>

          <footer className="mt-20 pt-6 border-t border-border text-xs text-muted-foreground">
            <p>FishAI · FishLab-ai · Deep Sea Lab Design Language</p>
            <p className="mt-1">本文档页是 fishai-web 应用内的路由 <code className="text-foreground">/docs</code></p>
          </footer>
        </main>
      </div>
    </div>
  );
}
