'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth';

export function AuthBootstrap() {
  const initSession = useAuthStore((state) => state.initSession);

  useEffect(() => {
    void initSession();
  }, [initSession]);

  return null;
}
