# third-party-frontend

基于 **Next.js 16** 的第三方 OAuth 登录前端，支持 **Google**、**X (Twitter)**、**Telegram**、**邮箱验证码** 四种登录方式，通过 API 代理与 [third-party-backend](https://github.com/Noahacd/third-party-backend) 协作完成认证与会话管理。

## 功能概览

| 功能 | 说明 |
|------|------|
| 单页首页 | 仅保留 `/`，展示后端连接状态与登录信息 |
| 登录弹窗 | Google / X / Telegram / 邮箱验证码均在弹窗中完成 |
| Google 登录 | OAuth 2.0 授权码流程，支持退出后强制重新授权 |
| X 登录 | OAuth 2.0 + PKCE，支持退出后强制重新授权 |
| Telegram 登录 | 跳转 Telegram OAuth，客户端解析 `#tgAuthResult` 完成登录 |
| 邮箱验证码 | 弹窗内两步：发码 → 校验登录 |
| 会话管理 | HttpOnly Cookie + Zustand 全局状态 |
| API 代理 | `/api/*` 转发至后端（开发 / 生产均通过代理） |

## 技术栈

- Next.js 16（App Router）
- React 19
- TypeScript
- Zustand（认证状态 + UI 状态）
- Tailwind CSS 4 + shadcn/ui

## 项目结构

```
src/
├── app/
│   ├── page.tsx                # 唯一页面：后端状态 + 登录信息
│   └── layout.tsx              # 全局布局、AuthBootstrap、登录弹窗
├── components/auth/
│   ├── AuthBootstrap.tsx       # 应用启动时初始化会话
│   ├── BackendConnectionStatus.tsx  # 首页后端连通检测
│   ├── HomeAuthSection.tsx     # 未登录提示 / 已登录用户信息
│   ├── LoginDialog.tsx         # 登录弹窗（全部登录方式）
│   ├── LoginDialogHost.tsx     # 全局弹窗挂载
│   ├── TelegramAuthHandler.tsx # 处理 Telegram OAuth 回调（hash）
│   ├── TelegramLoginButton.tsx
│   ├── EmailLoginForm.tsx
│   └── SiteHeader.tsx          # 顶栏登录 / 用户菜单
├── lib/
│   ├── request/                # 统一 HTTP 请求层
│   │   ├── http.ts
│   │   ├── client.ts
│   │   └── api/
│   │       ├── auth.requests.ts
│   │       ├── auth.ts
│   │       └── auth.server.ts
│   └── telegram-auth-result.ts
└── store/
    ├── auth.ts                 # 认证会话
    └── ui.ts                   # 登录弹窗开关
```

## 页面与交互

应用仅保留首页 `/`：

| 区域 | 未登录 | 已登录 |
|------|--------|--------|
| 顶栏 | 「登录」按钮 | 用户头像下拉（退出） |
| 首页 | 后端状态 + 「登录」卡片 | 后端状态 + 用户信息（头像、邮箱、ID、Token） |
| 登录弹窗 | Google / X / Telegram / 邮箱 | — |

点击首页或顶栏的「登录」打开 `LoginDialog`，**不在首页嵌入独立登录模块**。

## 快速开始

### 前置条件

- Node.js 18+
- pnpm
- 已启动并配置好的 [third-party-backend](../third-party-backend)（默认 `http://localhost:3000`）

### 安装与启动

```bash
pnpm install
pnpm dev
```

开发服务器默认监听 **`http://127.0.0.1:4050`**（请使用 `127.0.0.1`，不要用 `localhost`，避免 OAuth Cookie 域名不一致）。

### 同时启动前后端

```bash
# 终端 1 — 后端
cd third-party-backend && pnpm dev

# 终端 2 — 前端
cd third-party-frontend && pnpm dev
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

OAuth 密钥均配置在 **third-party-backend** 的 `.env` 中，前端无需持有。

## 登录流程

### Google / X

```
用户于登录弹窗点击登录
  → 跳转 /api/auth/{provider}（代理到后端）
  → 第三方授权页
  → 回调 /api/auth/{provider}/callback
  → 后端签发 Cookie，重定向 /
  → 首页 HomeAuthSection 展示用户信息
```

退出后再次登录 Google / X 时，会附带 `?reauth=1` 强制重新选择账号。

### Telegram

```
用户于登录弹窗点击 Telegram
  → GET /api/auth/telegram/config 获取 loginUrl
  → 跳转 oauth.telegram.org
  → 回到首页，URL 带 #tgAuthResult
  → TelegramAuthHandler 解析 hash
  → POST /api/auth/telegram 校验并签发 Cookie
  → 留在首页，展示用户信息
```

### 邮箱验证码

```
用户在登录弹窗输入邮箱 → 发送验证码
  → 输入 6 位验证码 → POST /api/auth/email/verify
  → 关闭弹窗，首页展示用户信息
```

## 认证与请求规范

### 全局状态

**认证（`useAuthStore`）**

- `session` — 当前用户与 access token
- `loading` / `initialized` — 初始化状态
- `initSession()` — 应用启动时调用（`AuthBootstrap`）

**UI（`useUiStore`）**

- `loginOpen` — 登录弹窗是否打开
- `openLogin()` — 打开登录弹窗

### HTTP 请求分层

所有接口调用必须通过 `lib/request/`，组件不直接 `fetch`：

```ts
import { startGoogleLogin, logout, fetchUserInfo } from '@/lib/request';
import { useUiStore } from '@/store/ui';

// 打开登录弹窗
useUiStore.getState().openLogin();

// 带 Token 的通用请求
import { apiFetch } from '@/lib/request';
const data = await apiFetch('/some-endpoint');
```

| 模块 | 职责 |
|------|------|
| `auth.requests.ts` | 原始 HTTP，不依赖 Store |
| `auth.ts` | 业务逻辑（登录跳转、同步 Store、logout） |
| `auth.server.ts` | 服务端会话请求（可选） |

### Cookie 与 Token

- `access_token`、`refresh_token` 由后端设置为 **HttpOnly Cookie**
- 前端从 `/auth/me` 响应获取 `accessToken` 存入 Store，供 `apiFetch` 使用
- Access Token 过期时，后端 `/auth/me` 会自动用 Refresh Token 续期

## 常用脚本

```bash
pnpm dev          # 开发（端口 4050）
pnpm dev:test     # 以 test 环境变量启动
pnpm build        # 构建（development 配置）
pnpm build:test   # 测试环境构建
pnpm build:prod   # 生产环境构建
pnpm start:test   # 启动测试构建产物
pnpm start:prod   # 启动生产构建产物
pnpm lint         # ESLint 检查
pnpm format       # Prettier 格式化
```

## 第三方平台配置要点

回调地址均通过 Next.js 代理，本地使用 **`http://127.0.0.1:4050`**：

| 平台 | 回调 / 配置地址 |
|------|----------------|
| Google | `http://127.0.0.1:4050/api/auth/google/callback` |
| X | `http://127.0.0.1:4050/api/auth/x/callback` |
| Telegram | BotFather `/setdomain` → `127.0.0.1`（生产用 Vercel 域名） |

详细配置见 [docs/README.md](../docs/README.md) 及各登录方式文档。

## 部署说明

### Vercel 部署（推荐）

前端部署到 Vercel，后端 API 部署到 Render。

#### 环境变量（Production）

```env
APP_ENV=production
NEXT_PUBLIC_API_URL=/api
API_PROXY_TARGET=https://your-backend.onrender.com
```

#### 后端配合

```env
FRONTEND_URL=https://your-app.vercel.app
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
X_REDIRECT_URI=https://your-app.vercel.app/api/auth/x/callback
```

OAuth 回调填 **Vercel 前端域名 + `/api`**。登录成功后后端重定向到 `/`。

#### 验证部署

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

## 常见问题

**页面一直「加载中」**  
确认后端已启动；会话请求有 10 秒超时。

**Google `redirect_uri_mismatch`**  
Google Console 回调 URI 必须与 `GOOGLE_REDIRECT_URI` 完全一致。

**Telegram 登录后无反应**  
检查 URL 是否含 `#tgAuthResult`；确认使用 Production 域名（Preview 有 Vercel 保护）。

**Cookie 未生效**  
统一使用 `127.0.0.1:4050` 访问，不要混用 `localhost`。

## 相关文档

- [从开发到部署（总览）](../docs/README.md)
- [Google 登录](../docs/google-login.md)
- [X 登录](../docs/x-login.md)
- [Telegram 登录](../docs/telegram-login.md)
- [邮箱登录](../docs/email-login.md)
