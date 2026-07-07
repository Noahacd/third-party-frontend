import { Suspense } from 'react';

import { DashboardCardSkeleton } from '@/components/auth/AuthCardSkeleton';
import { DashboardPanel } from '@/components/auth/DashboardPanel';

export default function Page() {
  return (
    <main className="bg-background text-foreground flex flex-1 items-center justify-center px-6 py-16">
      <Suspense fallback={<DashboardCardSkeleton />}>
        <DashboardPanel />
      </Suspense>
    </main>
  );
}

export const dynamic = 'force-dynamic';
