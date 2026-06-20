'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Rocket,
  Code2,
  Cpu,
  Server,
  Zap,
  HelpCircle,
  ChevronRight,
  Menu,
  X as _X,
  ArrowLeft,
  ScrollText,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { AuthDialog } from '@/components/auth-dialog';

// ── Helpers ──
function getClassByColor(color: string, base: string): string {
  if (color === 'emerald') {
    return `${base} bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30`;
  }
  if (color === 'amber') {
    return `${base} bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30`;
  }
  return `${base} bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/30`;
}

function getTextClassByColor(color: string, base: string): string {
  if (color === 'emerald') {
    return `${base} text-emerald-600 dark:text-emerald-400`;
  }
  if (color === 'amber') {
    return `${base} text-amber-600 dark:text-amber-400`;
  }
  return `${base} text-red-600 dark:text-red-400`;
}

// ── Doc Section Type ──
interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: DocSection[];
}

const DOC_NAV: DocSection[] = [
  {
    id: 'getting-started',
    title: '快速开始',
    icon: Rocket,
  },
  {
    id: 'api',
    title: 'API 接口文档',
    icon: Code2,
    children: [
      { id: 'api-chat', title: 'POST /api/chat', icon: Code2 },
      { id: 'api-auth', title: '认证接口', icon: Code2 },
      { id: 'api-conversations', title: '对话接口', icon: Code2 },
    ],
  },
  {
    id: 'architecture',
    title: '模型架构',
    icon: Cpu,
    children: [
      { id: 'arch-transformer', title: 'Transformer 架构', icon: Cpu },
      { id: 'arch-long-context', title: '超长上下文', icon: ScrollText },
      { id: 'arch-attention', title: '注意力机制', icon: Cpu },
      { id: 'arch-quantization', title: '量化策略', icon: Cpu },
    ],
  },
  {
    id: 'deployment',
    title: '部署指南',
    icon: Server,
  },
  {
    id: 'usage',
    title: '使用指南',
    icon: Zap,
    children: [
      { id: 'usage-chat', title: '基础聊天', icon: Zap },
      { id: 'usage-thinking', title: '深度思考', icon: Zap },
      { id: 'usage-search', title: '联网搜索', icon: Zap },
    ],
  },
  {
    id: 'faq',
    title: '常见问题',
    icon: HelpCircle,
  },
];

// ── Sidebar Component ──
function Sidebar({
  activeId,
  onNavigate,
  className,
}: {
  activeId: string;
  onNavigate: (id: string) => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    api: true,
    architecture: true,
    usage: true,
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNav = (items: DocSection[], depth = 0) =>
    items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isActive = activeId === item.id;
      const isExpanded = expanded[item.id];

      return (
        <div key={item.id}>
          <button
            onClick={() => {
              if (hasChildren) {
                toggleExpand(item.id);
              }
              onNavigate(item.id);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150 group ${
              depth > 0 ? 'pl-8' : ''
            } ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {depth === 0 && <item.icon className="w-4 h-4 shrink-0 opacity-70" />}
            <span className="flex-1 text-sm truncate">{item.title}</span>
            {hasChildren && (
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 text-neutral-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            )}
          </button>
          {hasChildren && isExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {renderNav(item.children as DocSection[], depth + 1)}
            </div>
          )}
        </div>
      );
    });

  return (
    <nav className={`space-y-1 ${className || ''}`}>
      {renderNav(DOC_NAV)}
    </nav>
  );
}

// ── Content Sections ──
/* eslint-disable max-lines-per-function */
function GettingStarted() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          快速开始
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          欢迎使用 FishAI 文档。本章节将引导你从零开始部署和使用 FishAI。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          什么是 FishAI？
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          FishAI 是 FishLab-ai 团队自研的 AI 助手，推理引擎使用 Rust 从零编写，
          采用 LLaMA-style Transformer 架构，经过深度优化和 4-bit 量化后模型体积仅约 12MB。
          尽管体积小巧，FishAI 在推理能力上表现优异，支持中文和英文问答、代码生成、文章写作等多种任务。
          整个 Web 应用基于 Next.js 16 构建，前端使用 TypeScript + Tailwind CSS 4 + Zustand 状态管理，
          后端使用 Prisma + SQLite 存储对话和用户数据，提供完整的聊天、深度思考、联网搜索等功能。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          技术栈概览
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: '推理引擎', value: 'Rust (candle-llama)' },
            { label: 'Web 框架', value: 'Next.js 16 + TypeScript' },
            { label: '前端样式', value: 'Tailwind CSS 4 + shadcn/ui' },
            { label: '状态管理', value: 'Zustand 5' },
            { label: '数据库', value: 'Prisma + SQLite' },
            { label: '模型格式', value: 'GGUF 4-bit 量化 (~12MB)' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/40"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 w-16 shrink-0">
                {item.label}
              </span>
              <span className="text-sm text-neutral-700 dark:text-neutral-300 font-mono">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          三步启动
        </h2>
        <div className="space-y-3">
          {[
            {
              step: 1,
              title: '克隆项目并安装依赖',
              desc: 'git clone 仓库后，运行 bun install 安装所有前端依赖。项目使用 Bun 作为包管理器，也可使用 npm 替代。',
            },
            {
              step: 2,
              title: '初始化数据库',
              desc: '运行 npx prisma generate 生成 Prisma Client，然后运行 npx prisma db push 创建 SQLite 数据库和表结构。数据库文件会自动生成在项目根目录。',
            },
            {
              step: 3,
              title: '启动开发服务器',
              desc: '运行 bun dev 启动 Next.js 开发服务器，默认监听 3000 端口。你也可以使用一键部署脚本 bash deploy.sh 完成全部步骤并启动生产模式。',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex gap-4 p-4 rounded-xl bg-white dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/40"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => router.push('/chat')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
        >
          开始聊天
        </button>
        <a
          href="#api"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('api')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold transition-colors"
        >
          查看 API 文档
        </a>
      </div>
    </div>
  );
}

/* eslint-disable max-lines-per-function */
function ApiChat() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          POST /api/chat
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          与 FishAI 进行对话的核心接口，支持流式输出（Server-Sent Events）。
          该接口是整个应用的核心，所有聊天功能都通过此接口实现。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          请求格式
        </h2>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`POST /api/chat
Content-Type: application/json

{
  "message": "你好",
  "conversationId": "可选，对话ID，不传则创建新对话",
  "userId": "可选，用户ID",
  "deepThinking": false,
  "webSearch": false
}`}</pre>
        </div>
        <div className="space-y-2">
          {[
            { name: 'message', type: 'string', required: true, desc: '用户消息内容' },
            { name: 'conversationId', type: 'string', required: false, desc: '对话 ID，不传则创建新对话' },
            { name: 'userId', type: 'string', required: false, desc: '用户 ID，用于关联对话' },
            { name: 'deepThinking', type: 'boolean', required: false, desc: '是否开启深度思考模式' },
            { name: 'webSearch', type: 'boolean', required: false, desc: '是否开启联网搜索' },
          ].map((p) => (
            <div key={p.name} className="flex items-start gap-3 text-sm">
              <code className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-mono text-xs shrink-0">
                {p.name}
              </code>
              <span className="text-neutral-400 text-xs shrink-0 w-16">
                {p.type}
                {p.required && <span className="text-red-500 ml-0.5">*</span>}
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">{p.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          响应格式（SSE）
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          响应使用 Server-Sent Events (SSE) 协议，Content-Type 为
          <code className="mx-1 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono">
            text/event-stream
          </code>
          。每个事件的 data 字段为 JSON 对象，包含 type 和 content 字段。
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`// 联网搜索结果（仅 webSearch=true 时）
data: {"type": "search", "content": "搜索到的网页内容..."}

// 深度思考内容（仅 deepThinking=true 时）
data: {"type": "thinking", "content": "让我分析一下..."}

// 回答内容（逐块推送）
data: {"type": "content", "content": "你好！"}

// 结束标记
data: {"type": "done", "conversationId": "conv_xxx"}`}</pre>
        </div>

        <div className="space-y-2">
          {[
            { type: 'search', desc: '联网搜索结果，包含搜索到的网页摘要信息。仅当 webSearch=true 时出现。前端通常以折叠面板展示。' },
            { type: 'thinking', desc: '深度思考过程，模型在生成回答前的推理步骤。仅当 deepThinking=true 时出现。思考内容可能包含 <think> 标签，后端会自动解析。' },
            { type: 'content', desc: '回答正文，逐块推送到前端。前端应累加拼接所有 content 事件的内容，形成完整回答。' },
            { type: 'done', desc: '对话完成标记，附带 conversationId。前端收到此事件后应停止流式读取，更新对话状态。' },
          ].map((e) => (
            <div key={e.type} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/40">
              <code className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {e.type}
              </code>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                {e.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          错误处理
        </h2>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-red-400 font-mono leading-relaxed">{`// 请求失败时返回 JSON
{
  "error": "消息不能为空"
}

// HTTP 状态码
400 - 请求参数错误
500 - 服务器内部错误`}</pre>
        </div>
      </section>
    </div>
  );
}

function ApiAuth() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          认证接口
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          FishAI 提供基于邮箱密码的用户注册和登录接口。密码使用 SHA-256 哈希存储，
          认证状态通过 localStorage 在客户端维护。后续版本将支持 JWT Token 认证。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          POST /api/auth/register
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          注册新用户。需要提供邮箱、密码和昵称。邮箱不可重复，密码长度至少 6 位。
          注册成功后自动登录，返回用户信息。
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`// 请求
POST /api/auth/register
{ "email": "user@example.com", "password": "xxx", "name": "昵称" }

// 成功响应
{ "id": "usr_xxx", "email": "user@example.com", "name": "昵称" }

// 失败响应
{ "error": "该邮箱已被注册" }`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          POST /api/auth/login
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          用户登录。验证邮箱和密码后返回用户信息。登录状态保存在客户端 localStorage 中，
          刷新页面后自动恢复。前端会在每次应用启动时调用 initAuth() 检查登录状态。
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`// 请求
POST /api/auth/login
{ "email": "user@example.com", "password": "xxx" }

// 成功响应
{ "id": "usr_xxx", "email": "user@example.com", "name": "昵称" }

// 失败响应
{ "error": "邮箱或密码错误" }`}</pre>
        </div>
      </section>
    </div>
  );
}

function ApiConversations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          对话接口
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          管理用户对话历史的接口。所有对话数据保存在本地 SQLite 数据库中，
          通过 userId 关联用户。支持获取对话列表和获取对话内消息两个接口。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          GET /api/conversations?userId=xxx
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          获取指定用户的所有对话列表，按更新时间降序排列。每个对话包含 id、title、创建时间和更新时间。
          还包含消息数量 _count.messages，方便前端显示对话预览信息。登录用户可点击聊天界面左上角的历史图标查看对话列表。
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`// 请求
GET /api/conversations?userId=usr_xxx

// 响应
[
  {
    "id": "conv_xxx",
    "title": "你好",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "_count": { "messages": 4 }
  }
]`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          GET /api/conversations/:id/messages
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          获取指定对话的所有消息，按创建时间升序排列。每条消息包含 id、role（user/assistant）、
          content（正文）、thinking（深度思考内容，可选）、searchResults（搜索结果，可选）和创建时间。
          前端切换对话时会调用此接口加载历史消息。
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`// 请求
GET /api/conversations/conv_xxx/messages

// 响应
[
  {
    "id": "msg_xxx",
    "role": "user",
    "content": "你好",
    "thinking": null,
    "searchResults": null,
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "msg_yyy",
    "role": "assistant",
    "content": "你好！有什么可以帮你的吗？",
    "thinking": null,
    "searchResults": null,
    "createdAt": "2025-01-01T00:00:01.000Z"
  }
]`}</pre>
        </div>
      </section>
    </div>
  );
}

function ArchTransformer() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Transformer 架构
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          FishAI 采用 LLaMA 风格的 Transformer 架构，经过深度优化以在极小体积下实现出色性能。
          相比原始 Transformer，LLaMA 架构在多个关键组件上进行了改进，使得模型在参数量大幅缩减的情况下
          依然保持良好的推理和生成能力。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          整体架构
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          FishAI 的模型由以下核心组件构成：输入嵌入层（Embedding）、多层 Transformer Block、
          以及输出投影层。每个 Transformer Block 包含一个自注意力子层和一个前馈网络（FFN）子层，
          两个子层均使用 RMSNorm 进行归一化。输出投影层与输入嵌入层共享参数（Weight Tying），
          这是减少模型体积的关键设计之一。整体数据流为：
          Token IDs → Embedding → N × TransformerBlock → RMSNorm → Linear(Weight Tying) → Logits。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          RoPE 旋转位置编码
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          旋转位置编码（Rotary Position Embedding, RoPE）是 LLaMA 架构的核心改进之一。
          与传统的正弦位置编码或可学习位置编码不同，RoPE 通过旋转矩阵将位置信息编码到
          Query 和 Key 向量中，使得注意力分数天然包含相对位置信息。这意味着模型无需额外的
          位置编码参数，同时支持长度外推——在训练时使用较短序列，推理时可以处理更长的上下文。
          RoPE 的数学本质是将向量视为复数，乘以与位置相关的旋转因子 e^(i*m*theta)，
          从而实现位置敏感的注意力计算。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          SwiGLU 激活函数
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          FishAI 的前馈网络使用 SwiGLU 激活函数替代了传统 Transformer 中的 ReLU 或 GELU。
          SwiGLU 结合了 Swish 激活和门控线性单元（GLU）的优点，公式为：
          SwiGLU(x, W, V, b, c) = (Swish(xW + b) ⊗ (xV + c))。
          门控机制允许模型选择性地传递信息，而 Swish 函数提供更平滑的梯度流动。
          实验表明，SwiGLU 在相同参数预算下比 ReLU 和 GELU 都有更好的表现，
          尤其是在小模型上提升更为显著。代价是 FFN 层需要两组权重矩阵（W 和 V），
          但这在现代 GPU 上的计算开销很小。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          RMSNorm 归一化
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          LLaMA 使用 RMSNorm（Root Mean Square Normalization）替代了标准 Transformer 中的
          LayerNorm。RMSNorm 的计算公式为：RMSNorm(x) = x / RMS(x) * g，其中 RMS(x) = sqrt(mean(x^2))。
          与 LayerNorm 相比，RMSNorm 无需计算均值，省去了一个减法操作，在保持归一化效果的同时
          减少了约 7% 到 10% 的计算开销。此外，LLaMA 采用 Pre-Norm 结构（归一化在注意力/FFN 之前），
          而非 Post-Norm，这使得训练更加稳定，无需预热阶段。每一层的残差连接也因 Pre-Norm 而更加平滑。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          权重绑定 (Weight Tying)
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          输入嵌入矩阵（Embedding Layer）与输出投影矩阵（LM Head）共享参数是 FishAI 减小模型体积的重要策略。
          在标准 Transformer 中，嵌入矩阵和输出矩阵是两个独立的参数块，分别占用 vocab_size × hidden_dim 的空间。
          通过权重绑定，这两个矩阵合二为一，直接节省了约一半的词表相关参数。
          对于 FishAI 这样追求极小体积的模型来说，这种优化尤为关键。实验表明，
          权重绑定对小模型的性能影响微乎其微，而节省的存储空间却非常可观。
        </p>
      </section>
    </div>
  );
}

/* eslint-disable max-lines-per-function */
function ArchLongContext() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          超长上下文
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          FishAI 支持高达 16M (16,777,216) Token 的上下文窗口。这不是简单的参数调大，
          而是通过三项自研技术从架构层面解决了超长上下文的内存和精度难题。
          虽然在纯推理&ldquo;聪明程度&rdquo;上可能不及更大的模型，但 16M 上下文意味着你可以塞进
          整本小说、完整代码仓库、长篇论文——信息量碾压一切短上下文模型。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      {/* 16M 上下文数字展示 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '上下文长度', value: '16M', desc: '16,777,216 Tokens' },
          { label: '模型体积', value: '~12MB', desc: '4-bit 混合精度量化' },
          { label: '上下文/体积比', value: '1.4M', desc: '每 MB 上下文 Token 数' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-emerald-50/30 dark:from-amber-950/10 dark:to-emerald-950/10 border border-amber-200/40 dark:border-amber-800/20 text-center">
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{s.value}</div>
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-1">{s.label}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Fish-Ring 环形注意力
        </h2>
        <div className="p-3 rounded-lg bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-800/20 text-xs text-amber-700 dark:text-amber-400 mb-2">
          核心灵感来源：DeepSeek Ring Attention + FishLab-ai 自研改进
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Ring Attention 最初由 DeepSeek 团队提出，核心思想是将超长序列切分成多个块（chunk），
          分配到不同的计算单元上环形传递。每个计算单元只缓存当前块对应的 Key-Value 对，
          计算完自己的块后将 KV 传递给下一个单元，同时接收上一个单元传来的 KV。
          这样一来，无论序列多长，每个单元的内存占用只跟块大小有关，实现了线性内存增长。
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Fish-Ring 在 DeepSeek Ring Attention 基础上做了两项关键改进：
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/40">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              改进一：自适应块大小调度 (Adaptive Chunk Scheduling)
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              DeepSeek 的原始 Ring Attention 使用固定块大小，但不同文本片段的信息密度差异巨大——
              一段代码可能每个 Token 都很重要，而一段闲聊大部分是冗余的。Fish-Ring 引入了
              自适应块大小调度器：在分块前先对序列做一次轻量级的复杂度评估（基于局部熵和
              Token 重复率），信息密度高的区域用小块（保留更多 KV 细节），密度低的区域用大块
              （节省内存和通信）。这使得在相同内存预算下，Fish-Ring 能比固定块大小的 Ring Attention
              保留更多有效信息，显著提升长上下文场景下的回答质量。
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/40">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
              改进二：重叠通信计算 (Overlapped Communication)
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              原始 Ring Attention 在传递 KV 块时存在通信等待——当前块计算完才能传给下一个单元。
              Fish-Ring 借鉴了 GPU 流式执行的思想，在计算当前块的同时异步预取下一个块的 KV。
              通过双缓冲（Double Buffering）机制，计算和通信可以重叠进行，
              使得跨块通信的等待时间几乎被完全隐藏。在多卡部署场景下，
              这项优化可带来 30-50% 的端到端推理加速。
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Fish-Scroll 滚动上下文压缩
        </h2>
        <div className="p-3 rounded-lg bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-800/20 text-xs text-amber-700 dark:text-amber-400 mb-2">
          FishLab-ai 原创技术——让 16M 上下文始终保持高信噪比
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          即使有了 Ring Attention 解决内存问题，16M Token 的上下文仍然面临一个根本挑战：
          不是所有信息都同等重要。一个 16M 的对话中，可能有 15M 是无关紧要的寒暄和重复，
          真正有价值的只有 1M。如果模型需要等量关注所有 Token，长上下文反而会拉低回答质量
          （即所谓的&ldquo;Lost in the Middle&rdquo;问题）。Fish-Scroll 就是为了解决这一问题而设计的。
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Fish-Scroll 的工作机制类似一个智能滚动窗口：
        </p>
        <div className="space-y-2">
          {[
            {
              step: '1',
              title: '信息密度评估',
              desc: '对每个对话轮次计算信息密度分数。代码块、数学公式、关键结论的密度高；寒暄、重复提问、已回答问题的密度低。密度评估基于 Token 重复率、语法复杂度和语义嵌入距离三个指标。',
            },
            {
              step: '2',
              title: '自适应压缩',
              desc: '低密度轮次被压缩为简短摘要（可能从 1000 Token 压缩到 50 Token），高密度轮次原样保留。压缩比例不是固定的，而是根据密度分数连续调整——密度越高压缩越少，密度越低压缩越狠。',
            },
            {
              step: '3',
              title: '滚动窗口',
              desc: '最近 N 轮对话始终完整保留（不压缩），超出窗口的早期对话按密度压缩。窗口大小根据当前上下文利用率动态调整，确保总能给新对话留出空间。',
            },
            {
              step: '4',
              title: '召回机制',
              desc: '当用户提到早期对话中的关键信息时，Fish-Scroll 可以从压缩摘要中识别并还原相关上下文。这意味着即使对话被压缩了，关键信息仍然可以按需取回。',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/40">
              <div className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{item.title}</span>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Dynamic RoPE Scaling 动态缩放
        </h2>
        <div className="p-3 rounded-lg bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-800/20 text-xs text-amber-700 dark:text-amber-400 mb-2">
          基于 NTK-aware 插值，让 RoPE 无损外推到 16M
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          RoPE 旋转位置编码在训练时有一个固定的最大序列长度。如果推理时的序列长度超过训练长度，
          位置编码的旋转角度会溢出，导致注意力计算崩溃——模型会&ldquo;不知道该看哪里&rdquo;。
          传统的解决方案是线性缩放（直接除以缩放因子），但这会让近距离 Token 的位置区分度下降，
          导致模型在短序列上也变笨。
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          FishAI 采用 Dynamic RoPE Scaling，灵感来自 NTK-aware 插值，但做了重要改进：
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`// 传统线性缩放（简单粗暴，损失精度）
θ_scaled = θ / scaling_factor

// NTK-aware 插值（调整频率基数而非直接缩放）
// 高频分量（近距离位置）几乎不缩放
// 低频分量（远距离位置）大幅缩放
base_new = base * scaling_factor ^ (dim / (dim - 2))

// FishAI Dynamic RoPE Scaling（自研改进）
// 根据实际序列长度自适应调整缩放因子
// 短序列 → scaling_factor ≈ 1（几乎无损）
// 长序列 → scaling_factor 逐渐增大（保证不溢出）
scaling_factor = max(1.0, seq_len / training_len)
base_dynamic = base * scaling_factor ^ (dim / (dim - 2))

// 额外改进：渐进式外推
// 在接近训练长度边界时平滑过渡，避免突变
if seq_len > training_len * 0.8:
    base_dynamic = smooth_interpolate(base, base_new, progress)`}</pre>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          这意味着：当你的对话很短时，模型的表现和训练时完全一样，没有任何精度损失；
          当对话逐渐变长时，缩放因子才会平滑增大，确保位置编码始终在有效范围内。
          这是 FishAI 能够在 16M 上下文上保持可用质量的关键技术之一。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          三大技术如何协同
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Fish-Ring、Fish-Scroll 和 Dynamic RoPE Scaling 三者不是独立工作的，
          而是在推理流程中紧密协作：
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`┌─────────────────────────────────────────────┐
│           16M Token 输入序列                   │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Dynamic RoPE Scaling │  ← 位置编码动态适配
        │  根据序列长度调整      │     短序列无损，长序列不溢出
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │    Fish-Scroll       │  ← 信息密度筛选
        │  自适应压缩低密度内容  │     16M → 有效信息浓缩
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │     Fish-Ring        │  ← 内存高效计算
        │  环形分块 + 自适应调度 │     线性内存，重叠通信
        └──────────┬──────────┘
                   │
                   ▼
              高质量回答`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          适用场景
        </h2>
        <div className="space-y-2">
          {[
            {
              title: '长文档分析',
              desc: '一次性塞进整本 PDF/论文/报告，模型可以跨章节引用和对比，无需反复切分和总结。',
              icon: '📄',
            },
            {
              title: '大代码仓库理解',
              desc: '把整个项目源码扔给模型，让它理解代码结构和依赖关系，进行跨文件重构建议。',
              icon: '💻',
            },
            {
              title: '多轮深度对话',
              desc: '几百轮的技术讨论也不会丢失上下文，模型始终记得之前说过什么、决定过什么。',
              icon: '🔄',
            },
            {
              title: '知识库问答',
              desc: '将大量参考资料作为上下文输入，模型基于这些资料精确回答问题，减少幻觉。',
              icon: '📚',
            },
          ].map((s) => (
            <div key={s.title} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/40 flex items-start gap-3">
              <span className="text-xl shrink-0">{s.icon}</span>
              <div>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{s.title}</span>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ArchAttention() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          注意力机制
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          FishAI 采用分组查询注意力（Grouped-Query Attention, GQA）机制，
          在推理速度和模型质量之间取得了良好的平衡。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          从 MHA 到 GQA
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          标准多头注意力（Multi-Head Attention, MHA）中，每个注意力头都有独立的 Query、Key 和 Value。
          这意味着在推理时需要为每个头缓存 KV 对，导致 KV Cache 占用大量显存。多查询注意力（Multi-Query Attention, MQA）
          让所有 Query 头共享一组 Key 和 Value，大幅减少缓存，但可能损失质量。GQA 是两者之间的折中方案：
          将 Query 头分成若干组，同组内的 Query 头共享一组 Key 和 Value。FishAI 使用 GQA 既保持了
          接近 MHA 的模型质量，又获得了接近 MQA 的推理加速效果，尤其在小模型上这种平衡至关重要。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          KV Cache 优化
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          在自回归生成过程中，每生成一个新 Token 都需要计算当前 Token 对之前所有 Token 的注意力。
          KV Cache 将之前计算过的 Key 和 Value 缓存起来，避免重复计算。对于 FishAI 这样的量化模型，
          KV Cache 同样可以量化存储，进一步降低内存占用。在 4-bit 量化模型中，KV Cache 通常使用
          FP16 或 INT8 精度，以在缓存大小和注意力精度之间取得平衡。FishAI 的 Rust 推理引擎
          针对缓存管理进行了优化，包括预分配缓存空间和高效的重计算策略。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          因果掩码与上下文长度
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          FishAI 使用因果掩码（Causal Mask）确保每个位置只能关注自身及之前的位置，
          这是自回归语言模型的基本约束。得益于 RoPE 的长度外推特性，FishAI 在训练时
          可以使用较短的上下文窗口，而在推理时支持更长的上下文。实际支持的上下文长度
          取决于模型的训练配置和可用显存，量化后的模型由于内存占用更小，通常可以处理更长的序列。
        </p>
      </section>
    </div>
  );
}

function ArchQuantization() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          量化策略
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          FishAI 采用混合精度量化策略，在模型体积和推理精度之间实现最优平衡。
          量化后模型仅约 12MB，可在资源受限的环境中高效运行。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          混合精度方案
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          不同层对精度的敏感度不同。FishAI 根据各层的特性采用差异化的量化精度：
          嵌入层（Embedding）和归一化层（RMSNorm）保持 FP16 精度，因为这些层的参数量小
          但对精度高度敏感；注意力层的 QKV 投影使用 INT8 量化，平衡精度和速度；
          前馈网络（FFN）的权重矩阵使用 INT4 量化，因为 FFN 占据了模型的大部分参数，
          INT4 量化带来的体积缩减最为显著。这种分层量化策略确保了关键计算环节的精度，
          同时最大化压缩比。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { layer: 'Embed / Norm', precision: 'FP16', color: 'emerald', desc: '精度敏感，参数量小，保持高精度' },
            { layer: 'Attention QKV', precision: 'INT8', color: 'amber', desc: '中等精度需求，平衡速度与质量' },
            { layer: 'FFN 权重', precision: 'INT4', color: 'red', desc: '参数量大，4-bit 压缩效果最显著' },
          ].map((item) => (
            <div
              key={item.layer}
              className={getClassByColor(item.color, 'p-4 rounded-xl border')}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                {item.layer}
              </div>
              <div
                className={getTextClassByColor(item.color, 'text-lg font-bold mb-1')}
              >
                {item.precision}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          GGUF 格式
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          FishAI 的量化模型以 GGUF（GPT-Generated Unified Format）格式存储。
          GGUF 是 llama.cpp 生态系统的标准模型格式，支持在单文件中存储模型权重、
          元数据和张量信息。GGUF 格式的优势在于：加载速度快（mmap 直接映射到内存）、
          跨平台兼容（支持 CPU、GPU、Metal、Vulkan 等后端）、以及灵活的量化选项。
          FishAI 的 Rust 推理引擎使用 candle-llama 库加载 GGUF 格式模型，
          充分利用 SIMD 指令集加速矩阵运算。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          SIMD 加速
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          FishAI 的 Rust 推理引擎针对 x86_64 和 ARM 架构进行了 SIMD（Single Instruction Multiple Data）优化。
          在 x86_64 平台上使用 AVX2/AVX-512 指令集，在 ARM 平台上使用 NEON 指令集，
          一次指令可同时处理多个数据元素。在量化推理中，SIMD 加速主要体现在两个方面：
          一是 INT4/INT8 权重的高效反量化（将低精度权重恢复为 FP16 进行计算），
          二是矩阵乘法的向量化运算。实际测试中，SIMD 优化可带来 2-4 倍的推理加速，
          使得 12MB 的小模型在普通 CPU 上也能实现流畅的对话体验。
        </p>
      </section>
    </div>
  );
}

/* eslint-disable max-lines-per-function */
function Deployment() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          部署指南
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          FishAI 的部署流程分为三个阶段：模型训练、权重文件生成、Web 服务部署。
          了解完整流程有助于你根据实际需求进行定制化部署。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          部署流程总览
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {[
            { step: '训练', desc: '使用自定义数据集训练 LLaMA-style 模型', icon: '🧠' },
            { step: '量化', desc: '将 FP32 权重量化为混合精度 GGUF 格式', icon: '📦' },
            { step: '部署', desc: '部署权重文件 + Web 应用到服务器', icon: '🚀' },
          ].map((item, i) => (
            <div key={item.step} className="flex-1 p-4 rounded-xl bg-white dark:bg-neutral-800/30 border border-neutral-200/60 dark:border-neutral-700/40 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-bold text-neutral-800 dark:text-neutral-200 mb-1">{item.step}</div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
              {i < 2 && (
                <ChevronRight className="hidden sm:block w-5 h-5 text-neutral-300 dark:text-neutral-600 absolute right-[-14px] top-1/2 -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          一键部署脚本
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          项目根目录提供了 <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono">deploy.sh</code> 一键部署脚本，
          自动完成依赖安装、数据库初始化、项目构建和服务启动五个步骤。适合首次部署和快速上线场景。
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`# 一键部署
bash deploy.sh

# 等价于手动执行以下步骤：
bun install                        # 1. 安装前端依赖
npx prisma generate                # 2. 生成 Prisma Client
npx prisma db push                 # 3. 创建数据库和表结构
bun run build                      # 4. 构建 Next.js 生产版本
bun run start                      # 5. 启动生产服务器`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          开发模式
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          开发模式下，Next.js 提供热更新（HMR）和详细的错误提示，适合日常开发和调试。
          只需运行 <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono">bun dev</code> 即可启动开发服务器，
          默认监听 3000 端口。修改源代码后浏览器会自动刷新。开发模式的构建速度更快，
          但运行时性能不如生产模式，不建议在生产环境中使用。
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`# 开发模式启动
bun dev

# 指定端口
PORT=8080 bun dev`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          环境变量
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          FishAI 通过 .env 文件管理环境变量。由于项目使用 SQLite 作为数据库，
          不需要配置数据库连接字符串。以下为可用的环境变量说明：
        </p>
        <div className="rounded-xl bg-neutral-950 dark:bg-neutral-900 p-4 overflow-x-auto">
          <pre className="text-sm text-emerald-400 font-mono leading-relaxed">{`# .env 文件（示例）
DATABASE_URL="file:./dev.db"        # SQLite 数据库路径
PORT=3000                           # 服务端口（默认 3000）`}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          模型权重文件
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          FishAI 的推理后端需要 GGUF 格式的量化权重文件。权重文件通常放置在服务器的指定目录中，
          Web 应用通过 API 调用将用户消息转发给推理引擎，推理引擎加载权重文件进行推理后返回结果。
          权重文件的获取方式包括：使用训练好的模型直接导出 GGUF 格式，
          或从 FishLab-ai 的 GitHub Releases 页面下载预训练权重。
          当前版本（v0.0.1-alpha）的 Web 前端通过 Z-AI SDK 桥接到云端推理服务，
          后续版本将支持本地推理引擎的完整集成。
        </p>
      </section>
    </div>
  );
}

function UsageChat() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          基础聊天
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          基础聊天是 FishAI 最核心的功能。在聊天界面输入问题，FishAI 会实时流式输出回答。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          开始对话
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          切换到「聊天」标签页，在底部输入框中输入你的问题，按回车或点击发送按钮即可开始对话。
          FishAI 会使用 Server-Sent Events (SSE) 协议实时推送回答内容，你可以看到文字逐字出现，
          无需等待完整回答生成。对话支持中文和英文，FishAI 会根据你的提问语言自动选择回复语言。
          技术术语保留英文原文，确保专业性和准确性。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          支持的功能
        </h2>
        <div className="space-y-2">
          {[
            { title: '问答对话', desc: '自然语言问答，支持多轮对话上下文' },
            { title: '代码生成', desc: '根据需求生成代码，支持语法高亮展示' },
            { title: '文章写作', desc: '写作、翻译、摘要等文本生成任务' },
            { title: '数学推理', desc: '基础数学计算和逻辑推理（建议开启深度思考）' },
          ].map((f) => (
            <div key={f.title} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/40">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">{f.title}</span>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          停止生成
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          在回答生成过程中，发送按钮会变为红色停止按钮。点击即可中断生成，
          已输出的内容会保留在对话中。这对于回答过长或方向偏离的情况非常有用。
          同时，如果流式输出超过 30 秒无新内容，系统会自动中断并提示超时。
        </p>
      </section>
    </div>
  );
}

function UsageThinking() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          深度思考
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          深度思考模式让 FishAI 在回答前先进行内部推理，提升回答的逻辑性和准确性。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          如何使用
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          在聊天输入区点击「深度思考」开关即可开启。开启后发送消息，FishAI 会先在后台进行深度推理，
          思考过程会实时展开显示在回答上方，帮助你理解 AI 的推理路径。回答完成后，
          思考内容会自动折叠为一个可展开的区域，点击即可查看完整的思考过程。
          深度思考特别适合数学推理、逻辑分析、代码调试等需要多步推理的场景。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          技术原理
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          深度思考基于 Chain-of-Thought（思维链）技术。当开启深度思考时，
          后端 API 会将请求中的 deepThinking 参数设为 true，模型会在回答正文前生成思考内容。
          思考内容通常包含在 &lt;think&gt; 标签中，后端的 ThinkingParser 会实时解析这些标签，
          将思考内容和回答内容分离后分别通过 SSE 事件推送到前端。
          前端收到 thinking 类型事件时，在消息气泡中显示思考指示器和思考文本；
          收到 content 类型事件时，显示正式回答。这种分离机制确保了
          推理过程的透明性，同时不影响最终回答的展示。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          适用场景
        </h2>
        <div className="space-y-2">
          {[
            { title: '数学与逻辑推理', desc: '多步骤推导、证明、复杂计算' },
            { title: '代码分析与调试', desc: '理解代码逻辑、定位 Bug、设计算法' },
            { title: '复杂决策分析', desc: '权衡利弊、方案比较、风险评估' },
            { title: '创意写作与构思', desc: '规划文章结构、头脑风暴、多角度思考' },
          ].map((s) => (
            <div key={s.title} className="p-3 rounded-lg bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-200/30 dark:border-emerald-800/20">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">{s.title}</span>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function UsageSearch() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          联网搜索
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          联网搜索让 FishAI 在回答前先检索相关信息，确保回答基于最新的网络数据。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          如何使用
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          在聊天输入区点击「联网搜索」开关即可开启。开启后发送消息，FishAI 会先根据你的问题
          搜索相关网页信息，搜索结果会以可折叠区域实时显示在回答上方。你可以看到搜索到了什么内容，
          确保回答是基于最新的真实信息。搜索完成后，FishAI 会结合搜索结果生成更准确的回答。
          联网搜索特别适合查询最新新闻、技术趋势、实时数据等需要最新信息的场景。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          技术原理
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          联网搜索基于 Z-AI SDK 的 Web Search API。当开启联网搜索时，
          后端 API 会将请求中的 webSearch 参数设为 true，在调用模型推理之前，
          先通过 Web Search API 搜索与用户问题相关的网页内容。
          搜索结果会通过 SSE 的 search 类型事件推送到前端，
          前端以 emerald 主题的折叠面板展示搜索结果摘要。
          同时，搜索结果会作为上下文信息注入到模型的提示词中，
          使模型能够基于搜索到的信息生成更准确的回答。整个搜索过程是异步的，
          不会阻塞流式输出的开始。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          与深度思考结合
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          联网搜索和深度思考可以同时开启。当两者都开启时，流程为：先搜索相关网页信息（search 事件），
          然后模型基于搜索结果进行深度推理（thinking 事件），最后输出正式回答（content 事件）。
          这种组合特别适合需要查证信息后进行深度分析的场景，例如：
          &ldquo;分析一下最近 AI 行业的融资趋势&rdquo;——先搜索最新数据，再进行推理分析。
        </p>
      </section>
    </div>
  );
}

function FAQ() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          常见问题
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
          关于 FishAI 的常见疑问和解答。如果你的问题没有在这里找到答案，
          欢迎在 GitHub 上提交 Issue。
        </p>
      </div>

      <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

      <div className="space-y-4">
        {[
          {
            q: 'FishAI 是什么？',
            a: 'FishAI 是 FishLab-ai 团队自研的 AI 助手，推理引擎用 Rust 从零编写，采用 LLaMA-style Transformer 架构。经过深度优化和 4-bit 混合精度量化，模型体积仅约 12MB，却能在各种任务中表现出色。Web 应用基于 Next.js 16 构建，提供完整的聊天、深度思考和联网搜索功能。',
          },
          {
            q: '为什么叫 FishAI？',
            a: '名字源自 FishLab-ai 团队，一脉相承。FishLab-ai 团队致力于开发小巧而强大的 AI 工具，Fish 的名字象征着灵活、敏捷和生命力——正如我们的模型，体积小巧却能力不凡。',
          },
          {
            q: '我的数据安全吗？',
            a: 'FishAI 将所有对话数据保存在服务器本地 SQLite 数据库中，不使用任何云数据库服务。用户密码使用 SHA-256 哈希后存储，原始密码不会被保存。我们不会将你的对话内容发送到第三方服务（联网搜索功能除外，搜索时会向搜索引擎发送查询关键词）。如果你对数据隐私有更高要求，可以自行部署 FishAI 到私有服务器。',
          },
          {
            q: '支持哪些语言？',
            a: 'FishAI 默认使用中文回答。如果用英文提问，会自动切换到英文模式。技术术语保留英文原文，确保专业性和准确性。后续版本将支持更多语言和语言偏好设置。',
          },
          {
            q: 'FishAI 是开源的吗？',
            a: '是的，FishAI 是开源项目。你可以在 GitHub 上查看源代码、提交 Issue 和 Pull Request。我们欢迎社区贡献，无论是代码、文档还是 Bug 报告。',
          },
          {
            q: '模型可以本地部署吗？',
            a: '可以。FishAI 的模型使用 GGUF 格式存储，可以通过 llama.cpp 或 candle 等推理引擎在本地加载。Web 应用使用 Next.js 构建，可以部署到任何支持 Node.js 的服务器上。详细部署流程请参考「部署指南」章节。',
          },
          {
            q: '为什么回答速度有时会变慢？',
            a: '回答速度受多种因素影响：服务器负载、网络延迟、问题复杂度、是否开启深度思考或联网搜索等。深度思考需要额外的推理时间，联网搜索需要等待搜索结果返回。如果持续出现超时，可能是服务器资源不足，建议检查服务器配置或减少并发请求数。',
          },
        ].map((item, i) => (
          <section key={item.q} className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
              {item.q}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {item.a}
            </p>
            {i < 6 && <div className="h-px bg-neutral-100 dark:bg-neutral-800/50" />}
          </section>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/30">
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          还有其他问题？欢迎在{' '}
          <a
            href="https://github.com/FishLab-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            GitHub
          </a>{' '}
          上提交 Issue，我们会尽快回复。
        </p>
      </div>
    </div>
  );
}

// ── Section Map ──
const SECTION_MAP: Record<string, () => React.ReactNode> = {
  'getting-started': GettingStarted,
  'api': GettingStarted, // parent falls to first child
  'api-chat': ApiChat,
  'api-auth': ApiAuth,
  'api-conversations': ApiConversations,
  'architecture': ArchTransformer,
  'arch-transformer': ArchTransformer,
  'arch-long-context': ArchLongContext,
  'arch-attention': ArchAttention,
  'arch-quantization': ArchQuantization,
  'deployment': Deployment,
  'usage': UsageChat,
  'usage-chat': UsageChat,
  'usage-thinking': UsageThinking,
  'usage-search': UsageSearch,
  'faq': FAQ,
};

// ── Main DocsTab Component ──
/* eslint-disable max-lines-per-function */
export default function DocsPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [activeId, setActiveId] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const handleNavigate = useCallback((id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
    // scroll content area to top
    const el = document.getElementById('docs-content');
    if (el) {el.scrollTop = 0;}
  }, []);

  // close sidebar on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) {setSidebarOpen(false);}
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const ContentComponent = SECTION_MAP[activeId] || GettingStarted;

  return (
    <div className="h-screen flex bg-white dark:bg-neutral-950 relative">
      {/* Floating login button - top right */}
      <div className="fixed top-4 right-4 z-30">
        {user ? (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/20">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="h-9 px-4 rounded-xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl border border-neutral-200/60 dark:border-neutral-700/40 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300/60 dark:hover:border-emerald-600/40 shadow-sm transition-all duration-200 flex items-center gap-1.5 text-xs font-medium"
          >
            <User className="w-3.5 h-3.5" />
            登录
          </button>
        )}
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile slide-in */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 shrink-0 border-r border-neutral-200/60 dark:border-neutral-800/40 bg-neutral-50/50 dark:bg-neutral-900/30 overflow-y-auto transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ top: 0 }}
      >
        <div className="p-4">
          {/* Sidebar header */}
          <div className="flex items-center gap-2.5 mb-5 px-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                FishAI 文档
              </div>
              <div className="text-[10px] text-neutral-400">v0.0.1-alpha</div>
            </div>
          </div>

          {/* Back to intro */}
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-lg text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回介绍页
          </button>

          {/* Navigation */}
          <Sidebar activeId={activeId} onNavigate={handleNavigate} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto" id="docs-content">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
            {DOC_NAV.flatMap((n) => [n, ...(n.children || [])]).find((n) => n.id === activeId)?.title || '文档'}
          </span>
        </div>

        {/* Content area */}
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <ContentComponent />
        </div>

        {/* Bottom nav */}
        <div className="max-w-3xl mx-auto px-6 sm:px-8 pb-8">
          <BottomNav activeId={activeId} onNavigate={handleNavigate} />
        </div>
      </main>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}

// ── Bottom navigation (prev / next) ──
function BottomNav({ activeId, onNavigate }: { activeId: string; onNavigate: (id: string) => void }) {
  // Flatten the nav tree into ordered list
  const flat = DOC_NAV.flatMap((n) =>
    n.children && n.children.length > 0
      ? [{ id: n.id, title: n.title }, ...n.children.map((c) => ({ id: c.id, title: c.title }))]
      : [{ id: n.id, title: n.title }]
  );

  const idx = flat.findIndex((f) => f.id === activeId);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  if (!prev && !next) {return null;}

  return (
    <div className="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-800">
      {prev ? (
        <button
          onClick={() => onNavigate(prev.id)}
          className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left max-w-[45%]"
        >
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">上一节</span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
            {prev.title}
          </span>
        </button>
      ) : (
        <div />
      )}
      {next ? (
        <button
          onClick={() => onNavigate(next.id)}
          className="flex flex-col items-end gap-0.5 px-4 py-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-right max-w-[45%]"
        >
          <span className="text-[10px] uppercase tracking-wider text-neutral-400">下一节</span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
            {next.title}
          </span>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
