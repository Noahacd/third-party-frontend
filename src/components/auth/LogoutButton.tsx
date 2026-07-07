'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { logout } from '@/lib/request';

export function LogoutButton() {
  const router = useRouter();
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

  return (
    <Button
      type="button"
      variant="outline"
      disabled={submitting}
      onClick={handleLogout}
    >
      {submitting ? '退出中...' : '退出登录'}
    </Button>
  );
}
