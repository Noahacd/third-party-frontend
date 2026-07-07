'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { AuthCardSkeleton } from '@/components/auth/AuthCardSkeleton';
import { UserAvatar } from '@/components/auth/UserAvatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { logout, startGoogleLogin } from '@/lib/request';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

type LoginPanelProps = {
  showBackLink?: boolean;
  redirectWhenLoggedIn?: string;
};

function maskToken(token: string) {
  if (token.length <= 16) {
    return token;
  }

  return `${token.slice(0, 8)}...${token.slice(-8)}`;
}

export function LoginPanel({
  showBackLink = false,
  redirectWhenLoggedIn,
}: LoginPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const storeError = useAuthStore((state) => state.error);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const oauthError = searchParams.get('error');
  const displayError = error ?? storeError;

  useEffect(() => {
    if (session && redirectWhenLoggedIn) {
      router.replace(redirectWhenLoggedIn);
    }
  }, [redirectWhenLoggedIn, router, session]);

  async function handleLogout() {
    setSubmitting(true);
    setError(null);

    try {
      await logout();
      router.replace('/');
      router.refresh();
    } catch {
      setError('退出登录失败，请稍后重试。');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <AuthCardSkeleton />;
  }

  const user = session?.user ?? null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Google 第三方登录</CardTitle>
        <CardDescription>
          登录后通过 apiFetch 自动携带 access token 发起请求。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {oauthError ? (
          <Alert variant="destructive">
            <AlertDescription>登录失败：{oauthError}</AlertDescription>
          </Alert>
        ) : null}

        {displayError ? (
          <Alert variant="warning">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        ) : null}

        {user ? (
          <div className="space-y-4">
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

            {session?.accessToken ? (
              <div className="bg-muted/50 space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Access Token</p>
                  <Badge variant="secondary">客户端已获取</Badge>
                </div>
                <p className="font-mono text-xs break-all">
                  {maskToken(session.accessToken)}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ size: 'lg' }))}
              >
                进入 Dashboard
              </Link>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={submitting}
                onClick={handleLogout}
              >
                {submitting ? '退出中...' : '退出登录'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={startGoogleLogin}
          >
            使用 Google 登录
          </Button>
        )}
      </CardContent>

      {showBackLink ? (
        <CardFooter className="justify-center border-t-0 bg-transparent">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: 'link', size: 'sm' }))}
          >
            返回首页
          </Link>
        </CardFooter>
      ) : null}
    </Card>
  );
}
