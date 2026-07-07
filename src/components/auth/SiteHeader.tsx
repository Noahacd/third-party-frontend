'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { UserAvatar } from '@/components/auth/UserAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/lib/request';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

export function SiteHeader() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const openLogin = useUiStore((state) => state.openLogin);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setSubmitting(true);

    try {
      await logout();
      router.replace('/');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const user = session?.user ?? null;

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-heading text-base font-semibold">
          Third Party Login
        </Link>

        <nav className="flex items-center gap-2">
          {loading ? (
            <Button variant="outline" size="sm" disabled>
              加载中...
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2 px-2" />
                }
              >
                <UserAvatar name={user.name} picture={user.picture} size="sm" />
                <span className="max-w-28 truncate">{user.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={submitting}
                    onClick={handleLogout}
                  >
                    {submitting ? '退出中...' : '退出登录'}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={openLogin}>
              登录
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
