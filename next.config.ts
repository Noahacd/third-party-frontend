import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';

function loadEnvFile(appEnv: string) {
  const envPath = resolve(process.cwd(), `.env.${appEnv}`);
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const appEnv =
  process.env.APP_ENV ?? (process.env.VERCEL ? 'production' : 'development');
loadEnvFile(appEnv);
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api';
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';
/** 仅 APP_ENV=production 视为生产；test 构建虽为 NODE_ENV=production，仍保留调试能力 */
const isProductionApp = appEnv === 'production';
const isVercel = Boolean(process.env.VERCEL);

/** 与 Next 内置列表合并，进一步按需导入子路径（见 next/dist/server/config.js） */
const optimizePackageImports = [
  'antd',
  '@ant-design/icons',
  '@tanstack/react-query',
  'dayjs',
  'qrcode.react',
] as const;
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_ENV: appEnv,
    NEXT_PUBLIC_API_URL: apiUrl,
  },
  /** Vercel 原生托管，无需 standalone；EC2 / Docker 自建部署时使用 */
  ...(isVercel ? {} : { output: 'standalone' as const }),

  /** 开发 / 测试保留 source map；正式生产关闭以减小体积 */
  productionBrowserSourceMaps: !isProductionApp,
  enablePrerenderSourceMaps: !isProductionApp,

  poweredByHeader: false,

  compiler: {
    /** 仅正式生产移除 console；开发 / 测试保留调试输出 */
    removeConsole: isProductionApp,
  },

  experimental: {
    optimizePackageImports: [...optimizePackageImports],
    /** 服务端组件树摇（Next 默认开启，显式保留） */
    optimizeServerReact: true,
    serverSourceMaps: !isProductionApp,
    turbopackSourceMaps: !isProductionApp,
    turbopackInputSourceMaps: !isProductionApp,
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
