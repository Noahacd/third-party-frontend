import { Suspense } from 'react';
import Link from 'next/link';

import { AuthCardSkeleton } from '@/components/auth/AuthCardSkeleton';
import { LoginPanel } from '@/components/auth/LoginPanel';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Page() {
  return (
    <main className="bg-background text-foreground flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <nav className="flex flex-wrap justify-center gap-2">
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          登录页
        </Link>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Dashboard（受保护）
        </Link>
      </nav>
      <Suspense fallback={<AuthCardSkeleton />}>
        <LoginPanel />
      </Suspense>
    </main>
  );
}
