# nextjs-party

基于 **Next.js 16** 的第三方 OAuth 登录前端示例，支持 **Google**、**X (Twitter)**、**Telegram** 三种登录方式，通过 API 代理与 `node-server` 后端协作完成认证与会话管理。

## 功能概览

| 功能 | 说明 |
|------|------|
| Google 登录 | 标准 OAuth 2.0 授权码流程，支持退出后强制重新授权 |
| X 登录 | OAuth 2.0 + PKCE，支持退出后强制重新授权 |
| Telegram 登录 | 跳转 Telegram OAuth，客户端解析 `#tgAuthResult` 完成登录 |
| 会话管理 | HttpOnly Cookie（access / refresh token）+ Zustand 全局状态 |
| 路由保护 | Middleware 拦截 `/dashboard`、`/profile`，未登录重定向至 `/login` |
| API 代理 | 开发环境将 `/api/*` 转发至后端 `http://localhost:3000` |

## 技术栈

- Next.js 16（App Router）
- React 19
- TypeScript
- Zustand（认证状态）
- Tailwind CSS 4 + shadcn/ui

## 项目结构

```
src/
├── app/                        # 页面路由
│   ├── page.tsx                # 首页（登录入口）
│   ├── login/page.tsx          # 登录页
│   └── dashboard/page.tsx      # 受保护的 Dashboard
├── components/auth/            # 认证相关 UI
│   ├── AuthBootstrap.tsx       # 应用启动时初始化会话
│   ├── LoginDialog.tsx         # 登录弹窗（Google / X / Telegram）
│   ├── LoginPanel.tsx          # 登录卡片
│   ├── TelegramAuthHandler.tsx # 处理 Telegram OAuth 回调（hash）
│   ├── TelegramLoginButton.tsx
│   └── SiteHeader.tsx
├── lib/
│   ├── request/                # 统一 HTTP 请求层
│   │   ├── http.ts             # 底层 fetch（超时、Cookie）
│   │   ├── client.ts           # apiFetch（自动带 Bearer Token）
│   │   └── api/
│   │       ├── auth.requests.ts  # 纯 HTTP 请求（会话 / Telegram）
│   │       ├── auth.ts           # 业务 API（登录跳转、logout 等）
│   │       └── auth.server.ts    # Middleware 服务端请求
│   └── telegram-auth-result.ts # 解析 #tgAuthResult
├── store/auth.ts               # Zustand 认证 Store
└── middleware.ts               # 路由守卫
```

## 快速开始

### 前置条件

- Node.js 18+
- pnpm
- 已启动并配置好的 [node-server](../node-server)（默认 `http://localhost:3000`）

### 安装与启动

```bash
cd nextjs-party
pnpm install
pnpm dev
```

开发服务器默认监听 **`http://127.0.0.1:4050`**（注意使用 `127.0.0.1`，不要用 `localhost`，避免 OAuth Cookie 域名不一致）。

### 同时启动前后端

```bash
# 终端 1 — 后端
cd node-server && pnpm dev

# 终端 2 — 前端
cd nextjs-party && pnpm dev
```

## 环境变量

按 `APP_ENV` 加载对应文件（见 `next.config.ts`）：

| 文件 | 用途 |
|------|------|
| `.env.development` | 本地开发（默认） |
| `.env.test` | 测试环境构建 |
| `.env.production` | 生产环境构建 |

| 变量 | 说明 | 示例 |
|------|------|------|
| `APP_ENV` | 运行环境标识 | `development` |
| `NEXT_PUBLIC_API_URL` | 前端请求 API 前缀 | `/api` |
| `API_PROXY_TARGET` | Next.js 代理目标（后端地址） | `http://localhost:3000` |

开发环境示例（`.env.development`）：

```env
APP_ENV=development
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=http://localhost:3000
```

OAuth 相关密钥（Google Client ID、Telegram Bot Token 等）均配置在 **node-server** 的 `.env` 中，前端无需持有。

## 登录流程

### Google / X

```
用户点击登录
  → 跳转 /api/auth/{provider}（代理到后端）
  → 第三方授权页
  → 回调 /api/auth/{provider}/callback
  → 后端签发 Cookie，重定向 /dashboard
  → AuthBootstrap 拉取 /api/auth/me，写入 Zustand
```

退出登录后，前端会在 `sessionStorage` 写入 `auth.require_reauth`，下次 Google / X 登录会附带 `?reauth=1` 强制重新选择账号。

### Telegram

Telegram OAuth 授权结果通过 URL **hash**（`#tgAuthResult=...`）返回，服务端 callback 无法读取，因此由客户端处理：

```
用户点击 Telegram 登录
  → GET /api/auth/telegram/config 获取 loginUrl
  → 跳转 oauth.telegram.org
  → 回到首页，URL 带 #tgAuthResult
  → TelegramAuthHandler 解析 hash
  → POST /api/auth/telegram 校验并签发 Cookie
  → window.location.assign('/dashboard')
```

## 认证与请求规范

### 全局状态（Zustand）

`useAuthStore` 提供：

- `session` — 当前用户与 access token
- `loading` / `initialized` — 初始化状态
- `initSession()` — 应用启动时调用（`AuthBootstrap`）
- `ensureSession()` — 懒加载会话
- `clearSession()` — 退出时清空

### HTTP 请求分层

所有接口调用必须通过 `lib/request/`，组件不直接 `fetch`：

```ts
// 业务 API（推荐）
import { startGoogleLogin, logout, fetchUserInfo } from '@/lib/request';

// 带 Token 的通用请求
import { apiFetch } from '@/lib/request';
const data = await apiFetch('/some-endpoint');
```

| 模块 | 职责 |
|------|------|
| `auth.requests.ts` | 原始 HTTP（`/auth/me`、`/auth/refresh`、Telegram 等），不依赖 Store |
| `auth.ts` | 业务逻辑（登录跳转、同步 Store、logout） |
| `auth.server.ts` | Middleware 专用，Edge 环境带 Cookie 请求 `/api/auth/me` |

### Cookie 与 Token

- `access_token`、`refresh_token` 由后端设置为 **HttpOnly Cookie**
- 前端同时从 `/auth/me` 响应中获取 `accessToken` 存入 Store，供 `apiFetch` 在 `Authorization` 头中使用
- Access Token 过期时，后端 `/auth/me` 会自动用 Refresh Token 续期

## 路由与页面

| 路径 | 访问控制 | 说明 |
|------|----------|------|
| `/` | 公开 | 首页，含登录入口 |
| `/login` | 公开 | 独立登录页 |
| `/dashboard` | 需登录 | Middleware 保护，展示用户信息 |
| `/profile` | 需登录 | Middleware 保护（预留） |

未登录访问受保护路由时，会重定向到 `/login?redirect=/dashboard`。

## 常用脚本

```bash
pnpm dev          # 开发（端口 4050，自动打开浏览器）
pnpm dev:test     # 以 test 环境变量启动开发服务器
pnpm build        # 构建（development 配置）
pnpm build:test   # 测试环境构建
pnpm build:prod   # 生产环境构建
pnpm start:test   # 启动测试构建产物
pnpm start:prod   # 启动生产构建产物
pnpm lint         # ESLint 检查
pnpm format       # Prettier 格式化
```

## 第三方平台配置要点

以下回调地址均通过 Next.js 代理，请使用 **`http://127.0.0.1:4050`** 作为前端域名：

| 平台 | 回调 / 配置地址 |
|------|----------------|
| Google | `http://127.0.0.1:4050/api/auth/google/callback` |
| X | `http://127.0.0.1:4050/api/auth/x/callback` |
| Telegram | Bot 由 [@BotFather](https://t.me/BotFather) 创建；`TELEGRAM_BOT_USERNAME` 不带 `@` |

详细后端环境变量见 [node-server README](../node-server/README.md)。

## 部署说明

### Vercel 部署（推荐）

前端部署到 Vercel，后端 API 部署到 Render（或其他 Node 托管）。

#### 1. 连接 GitHub 仓库

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard) → **Add New → Project**
2. 导入 `Noahacd/third-party-frontend`
3. Framework 会自动识别为 **Next.js**

#### 2. 构建设置

`vercel.json` 已配置，一般无需修改：

| 配置项 | 值 |
|--------|-----|
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build:prod` |
| Output | Next.js 默认 |

#### 3. 环境变量（Production）

在 Vercel **Settings → Environment Variables** 添加：

```env
APP_ENV=production
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=https://your-backend.onrender.com
```

将 `API_PROXY_TARGET` 替换为真实后端地址，例如：

`https://third-party-frontend.onrender.com`（Render 上的 backend 服务 URL）

#### 4. 后端配合

Render 后端需设置：

```env
FRONTEND_URL=https://your-app.vercel.app
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
X_REDIRECT_URI=https://your-app.vercel.app/api/auth/x/callback
```

OAuth 回调地址填 **Vercel 前端域名 + `/api`**。

#### 5. 验证部署

```bash
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/test
```

#### 架构

```
浏览器 → Vercel 前端 (/api/* 代理)
              ↓
         Render 后端 (Express API)
```

### 其他平台

- 非 Vercel 部署默认输出 **standalone** 构建（`next.config.ts`）
- 生产环境需将 `API_PROXY_TARGET` 指向真实后端 API 地址
- 确保前后端 `FRONTEND_URL` / Cookie `secure` 配置与 HTTPS 域名一致

## 常见问题

**页面一直「加载中」**  
确认 `node-server` 已启动；会话请求有 10 秒超时，后端不可达会显示错误提示。

**Google `redirect_uri_mismatch`**  
Google Console 中的授权回调 URI 必须与 `GOOGLE_REDIRECT_URI` 完全一致（含 `127.0.0.1` 与端口）。

**Telegram 登录后回到首页无反应**  
检查 URL 是否包含 `#tgAuthResult`；确认 `TelegramAuthHandler` 已在 `layout.tsx` 中挂载。

**Cookie 未生效**  
前后端域名需一致（均使用 `127.0.0.1:4050` 访问，不要混用 `localhost`）。
