<div align="center">

# 💬 FishAI Chat

**基于 Next.js 的 AI 聊天界面 — 流式响应 + 实时 Markdown + 代码高亮**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/FishLab-ai/fishai-chat)
[![Version](https://img.shields.io/badge/version-v3.1.0-blue)](https://github.com/FishLab-ai/fishai-chat)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

**Next.js Chat Frontend with SSE Streaming & Real-Time Markdown Rendering**

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 项目简介

FishAI Chat 是 FishLab-ai 自研的 AI 聊天前端，基于 Next.js 16 构建。支持 SSE 流式响应、打字机效果、实时 Markdown 渲染、代码块语法高亮与一键复制，提供流畅的 AI 对话体验。后端通过 Caddy 反向代理部署，配合 FishAI Engine 推理服务使用。

### 核心特性

- [x] **SSE 流式响应** — Server-Sent Events 实时传输，逐 token 推送到前端
- [x] **打字机效果** — 逐字渲染 AI 回复，视觉上模拟真人打字
- [x] **实时 Markdown 渲染** — 流式渐进渲染，支持未闭合代码块、加粗等
- [x] **代码块语法高亮** — 基于 react-syntax-highlighter，支持 100+ 语言
- [x] **代码一键复制** — 代码块右上角 Copy 按钮，1.5 秒反馈动画
- [x] **深色/浅色主题** — 系统偏好自动适配 + 手动切换
- [x] **对话管理** — 多对话切换，消息历史记忆
- [x] **OpenAI 兼容 API** — 后端代理 FishAI Engine，兼容 OpenAI 接口格式

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Next.js](https://nextjs.org/) | 16 | React 全栈框架 |
| [TypeScript](https://www.typescriptlang.org/) | 5 | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | 原子化样式 |
| [shadcn/ui](https://ui.shadcn.com/) | latest | UI 组件库（Radix UI 基础） |
| [react-markdown](https://github.com/remarkjs/react-markdown) | 10 | Markdown 渲染 |
| [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) | 15 | 代码语法高亮 |
| [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) | 0.0.17 | AI SDK 集成 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 5 | 轻量状态管理 |
| [Framer Motion](https://www.framer.com/motion/) | 12 | 动画引擎 |
| [Prisma](https://www.prisma.io/) | 6 | ORM 数据库 |
| [Caddy](https://caddyserver.com/) | — | 反向代理 + 自动 HTTPS |

### 快速开始

```bash
# 安装依赖
npm install

# 构建生产版本（standalone 输出）
npm run build

# 启动生产服务器
npm start

# 或开发模式
npm run dev
```

生产模式默认监听 `http://localhost:3000`。

### Caddy 反向代理配置

项目已包含 `Caddyfile`，配置 Caddy 将 80/443 端口流量代理到 Next.js 服务：

```
# Caddyfile
:81 {
    # 端口转发查询参数
    @transform_port_query {
        query XTransformPort=*
    }
    handle @transform_port_query {
        reverse_proxy localhost:{query.XTransformPort}
    }

    # 默认代理到 Next.js
    handle {
        reverse_proxy 127.0.0.1:3000
    }
}
```

启动 Caddy：

```bash
caddy run
```

### 项目结构

```
fishai-chat/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # 根布局（字体、主题、Toaster）
│   │   ├── page.tsx         # 聊天主页面（SSE + Markdown + 代码高亮）
│   │   ├── globals.css      # 全局样式
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts # Chat API（SSE 流式代理）
│   ├── components/ui/       # shadcn/ui 组件库（50+ 组件）
│   ├── hooks/               # 自定义 Hooks
│   └── lib/                 # 工具函数
├── prisma/
│   └── schema.prisma        # 数据库 Schema
├── public/                  # 静态资源
├── Caddyfile                # Caddy 反向代理配置
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### API 接口

#### POST `/api/chat`

发送聊天消息，返回 SSE 流式响应。

**请求体：**

```json
{
  "message": "你好，FishAI！",
  "conversationId": "default",
  "temperature": 0.7,
  "maxTokens": 8192
}
```

**响应：** `text/event-stream`

```
data: {"content": "你"}
data: {"content": "好"}
data: {"content": "！"}
data: [DONE]
```

### 架构流程

```
浏览器 (React)
    │
    ├──→ POST /api/chat (message)
    │
    ├──→ Next.js API Route (route.ts)
    │       │
    │       ├──→ ZAI SDK → LLM 后端 (SSE Stream)
    │       │
    │       └──→ ReadableStream → SSE 响应
    │
    └──→ EventSource / fetch 读取 SSE
            │
            ├──→ 逐 token 渲染 Markdown
            ├──→ 代码块语法高亮
            └──→ 打字机效果动画
```

### 部署

```bash
# 1. 构建 standalone 产物
npm run build

# 2. 启动服务
npm start

# 3. 配置 Caddy 反向代理
caddy run

# 4. 访问
# http://localhost:81 → Caddy → Next.js :3000
```

---

## English

### Overview

FishAI Chat is FishLab-ai's AI chat frontend built with Next.js 16. It features SSE streaming, typewriter effect, real-time Markdown rendering, syntax-highlighted code blocks with one-click copy, and a smooth conversational experience. Deployed behind Caddy reverse proxy, it works with FishAI Engine inference service.

### Key Features

- [x] **SSE Streaming** — Server-Sent Events for real-time token-by-token delivery
- [x] **Typewriter Effect** — Character-by-character rendering for natural feel
- [x] **Real-Time Markdown** — Progressive rendering with streaming support
- [x] **Code Syntax Highlighting** — 100+ languages via react-syntax-highlighter
- [x] **One-Click Code Copy** — Copy button with animated feedback
- [x] **Dark/Light Theme** — System preference detection + manual toggle
- [x] **Conversation Management** — Multi-conversation switching with history
- [x] **OpenAI-Compatible API** — Proxies to FishAI Engine backend

### Tech Stack

- **Next.js 16** + **TypeScript 5** + **Tailwind CSS 4** + **shadcn/ui**
- **react-markdown** + **react-syntax-highlighter** for rich content
- **Zustand** for state management, **Framer Motion** for animations
- **Prisma** ORM, **Caddy** reverse proxy

### Quick Start

```bash
npm install
npm run build
npm start
```

### Caddy Setup

The project includes a `Caddyfile` that proxies traffic to the Next.js server on port 3000.

```bash
caddy run  # Starts on :81, proxies to 127.0.0.1:3000
```

### API

**POST `/api/chat`**

```json
// Request
{ "message": "Hello!", "conversationId": "default", "temperature": 0.7 }

// Response: text/event-stream
data: {"content": "Hello"}
data: {"content": " there"}
data: [DONE]
```

### License

MIT License - FishLab-ai

---

<div align="center">

**FishAI Chat v3.1.0** — Made with 💬 by [FishLab-ai](https://github.com/FishLab-ai)

</div>
