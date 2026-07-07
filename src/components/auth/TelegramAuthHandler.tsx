'use client';

import { useEffect, useRef } from 'react';

import { loginWithTelegram } from '@/lib/request';
import {
  hasTelegramAuthResult,
  parseTelegramAuthResult,
} from '@/lib/telegram-auth-result';

export function TelegramAuthHandler() {
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current || typeof window === 'undefined') {
      return;
    }

    const { hash, pathname, search } = window.location;
    if (!hasTelegramAuthResult(hash)) {
      return;
    }

    const authData = parseTelegramAuthResult(hash);
    if (!authData) {
      return;
    }

    handledRef.current = true;

    void (async () => {
      try {
        await loginWithTelegram(authData);

        const params = new URLSearchParams(search);
        params.delete('error');
        const nextSearch = params.toString();
        const cleanUrl = nextSearch ? `${pathname}?${nextSearch}` : pathname;

        window.history.replaceState(null, '', cleanUrl || '/');
        window.location.assign('/');
      } catch {
        window.location.assign('/?error=telegram_login_failed');
      }
    })();
  }, []);

  return null;
}
