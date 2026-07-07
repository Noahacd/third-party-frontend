'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AuthCardSkeleton } from '@/components/auth/AuthCardSkeleton';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { UserAvatar } from '@/components/auth/UserAvatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: '授权状态校验失败，请重新登录',
  oauth_failed: 'Google 登录失败，请稍后重试',
  x_not_configured: 'X 登录未配置',
  x_oauth_failed: 'X 登录失败，请稍后重试',
  telegram_not_configured: 'Telegram 登录未配置',
  invalid_telegram_auth: 'Telegram 授权校验失败',
  telegram_login_failed: 'Telegram 登录失败，请稍后重试',
};

function maskToken(token: string) {
  if (token.length <= 16) {
    return token;
  }

  return `${token.slice(0, 12)}...${token.slice(-12)}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN');
}

export function HomeAuthSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const storeError = useAuthStore((state) => state.error);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const openLogin = useUiStore((state) => state.openLogin);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const oauthErrorKey = searchParams.get('error');
  const oauthError = oauthErrorKey
    ? (OAUTH_ERROR_MESSAGES[oauthErrorKey] ?? `登录失败：${oauthErrorKey}`)
    : null;
  const displayError = error ?? storeError;

  useEffect(() => {
    if (!oauthErrorKey) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('error');
    const nextSearch = params.toString();
    const nextUrl = nextSearch ? `/?${nextSearch}` : '/';
    router.replace(nextUrl);
  }, [oauthErrorKey, router, searchParams]);

  async function handleRefreshSession() {
    setRefreshing(true);

    try {
      await refreshSession();
      setError(null);
    } catch {
      setError('刷新会话失败，请稍后重试。');
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return <AuthCardSkeleton />;
  }

  if (!session) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">第三方登录演示</CardTitle>
          <CardDescription>
            支持 Google、X、Telegram 与邮箱验证码登录
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {oauthError ? (
            <Alert variant="destructive">
              <AlertDescription>{oauthError}</AlertDescription>
            </Alert>
          ) : null}

          {displayError ? (
            <Alert variant="warning">
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="button" size="lg" className="w-full" onClick={openLogin}>
            登录
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { user, accessToken } = session;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          已登录
        </Badge>
        <CardTitle className="text-2xl">欢迎，{user.name}</CardTitle>
        <CardDescription>当前登录信息如下</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {displayError ? (
          <Alert variant="warning">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4">
          <UserAvatar name={user.name} picture={user.picture} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            <p className="text-muted-foreground truncate text-sm">
              {user.email}
            </p>
          </div>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b pb-3">
            <dt className="text-muted-foreground">用户 ID</dt>
            <dd className="text-right font-medium">{user.id}</dd>
          </div>
          {user.lastLoginAt ? (
            <div className="flex justify-between gap-4 border-b pb-3">
              <dt className="text-muted-foreground">最近登录</dt>
              <dd className="text-right font-medium">
                {formatDateTime(user.lastLoginAt)}
              </dd>
            </div>
          ) : null}
          <div className="space-y-2">
            <dt className="text-muted-foreground">Access Token</dt>
            <dd className="bg-muted/50 rounded-lg border p-3 font-mono text-xs break-all">
              {maskToken(accessToken)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={refreshing}
            onClick={handleRefreshSession}
          >
            {refreshing ? '刷新中...' : '刷新会话'}
          </Button>
          <LogoutButton />
        </div>
      </CardContent>
    </Card>
  );
}
