import { Suspense } from 'react';

import { AuthCardSkeleton } from '@/components/auth/AuthCardSkeleton';
import { BackendConnectionStatus } from '@/components/auth/BackendConnectionStatus';
import { HomeAuthSection } from '@/components/auth/HomeAuthSection';

export default function Page() {
  return (
    <main className="bg-background text-foreground flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <BackendConnectionStatus />
      <Suspense fallback={<AuthCardSkeleton />}>
        <HomeAuthSection />
      </Suspense>
    </main>
  );
}
