'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { DashboardCardSkeleton } from '@/components/auth/AuthCardSkeleton';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { UserAvatar } from '@/components/auth/UserAvatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

function maskToken(token: string) {
  if (token.length <= 16) {
    return token;
  }

  return `${token.slice(0, 12)}...${token.slice(-12)}`;
}

export function DashboardPanel() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const storeError = useAuthStore((state) => state.error);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const displayError = error ?? storeError;

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
    return <DashboardCardSkeleton />;
  }

  if (!session) {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>未登录</CardTitle>
          <CardDescription>
            {displayError ?? '未获取到客户端登录会话'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            onClick={() => router.push('/login?redirect=/dashboard')}
          >
            去登录
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { user, accessToken } = session;

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <Badge
          variant="secondary"
          className="w-fit"
        >
          受保护页面
        </Badge>
        <CardTitle className="text-2xl">欢迎，{user.name}</CardTitle>
        <CardDescription>
          后续 API 请求统一使用 apiFetch，会自动带上 Authorization 请求头。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {displayError ? (
          <Alert variant="warning">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4">
          <UserAvatar
            name={user.name}
            picture={user.picture}
            size="lg"
          />
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
              <dd className="text-right font-medium">{user.lastLoginAt}</dd>
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
          <Link
            href="/"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            返回首页
          </Link>
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
