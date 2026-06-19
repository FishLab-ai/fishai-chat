# fishai-web

> FishLab-ai 自研 AI 助手**前端** — 纯 UI，调 fishai-server 的 API

## 职责

提供 FishAI 聊天界面、文档页（`/docs`）、主题切换。
**不包含任何后端代码**（无 API Routes、无 Prisma、无数据库）。
后端在 [`fishai-server`](https://github.com/FishLab-ai/fishai-server)。

## 技术栈

- **Next.js 16** (App Router + Turbopack)
- **React 19**
- **Tailwind CSS 4** (OKLCH 色彩空间)
- **shadcn/ui** (50+ 组件)
- **Geist + Noto Sans SC** 字体

## 设计语言

**Deep Sea Lab（深海实验室）** — 主色深海青蓝 `oklch(0.55 0.13 220)`，
呼应 Fish（鱼/海洋）+ Lab（实验室精确感）+ Rust 引擎（金属/工业）。

完整设计语言文档：访问部署后的 `/docs` 路由。

## 路由

| 路径 | 说明 |
|------|------|
| `/` | 聊天界面（落地页 + 对话） |
| `/docs` | 项目文档页（架构、设计语言、部署、API 速查） |

## 部署

```bash
# 默认端口 3001（同源模式，/api/* 反代到 fishai-server:3000）
./deploy.sh

# 自定义端口
PORT=8080 ./deploy.sh

# 跨域模式（后端在不同域名）
API_BASE_URL=https://api.fishai.example.com ./deploy.sh

# 其他子命令
./deploy.sh stop | restart | status | logs | build
```

## 环境变量

```bash
# 同源模式（默认，留空）：/api/* 由 Next.js rewrites 反代到 fishai-server
NEXT_PUBLIC_API_BASE_URL=

# 跨域模式：填后端地址
# NEXT_PUBLIC_API_BASE_URL=https://api.fishai.example.com

# 服务端变量：rewrites 目标地址（默认 http://localhost:3000）
# SERVER_URL=http://localhost:3000
```

## 同源 vs 跨域

| 模式 | 设置 | 适用 |
|------|------|------|
| **同源**（推荐） | `NEXT_PUBLIC_API_BASE_URL=`（空） | 前后端同域名部署，Next.js rewrites 反代 |
| **跨域** | `NEXT_PUBLIC_API_BASE_URL=https://api...` | 前后端不同域名，需要 fishai-server CORS middleware |

## License

FishLab-ai 内部使用
