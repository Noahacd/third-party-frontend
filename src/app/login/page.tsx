import { Suspense } from 'react';

import { AuthCardSkeleton } from '@/components/auth/AuthCardSkeleton';
import { LoginPanel } from '@/components/auth/LoginPanel';

type PageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { redirect: redirectTo } = await searchParams;

  return (
    <main className="bg-background text-foreground flex flex-1 items-center justify-center px-6 py-16">
      <Suspense fallback={<AuthCardSkeleton />}>
        <LoginPanel
          showBackLink
          redirectWhenLoggedIn={redirectTo ?? '/dashboard'}
        />
      </Suspense>
    </main>
  );
}
