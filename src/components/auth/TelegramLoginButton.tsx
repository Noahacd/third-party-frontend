'use client';

import { useEffect, useState } from 'react';

import { TelegramIcon } from '@/components/auth/LoginProviderIcons';
import { LoginOptionRow } from '@/components/auth/LoginOptionRow';
import { fetchTelegramConfig, startTelegramLogin } from '@/lib/request';

export function TelegramLoginButton() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkConfig() {
      const config = await fetchTelegramConfig();
      if (!cancelled) {
        setEnabled(Boolean(config?.loginUrl));
        setLoading(false);
      }
    }

    void checkConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <LoginOptionRow
        icon={<TelegramIcon className="size-[18px] text-white" />}
        iconClassName="bg-[#2aabee]"
        label="Telegram"
        disabled
      />
    );
  }

  if (!enabled) {
    return null;
  }

  return (
    <LoginOptionRow
      icon={<TelegramIcon className="size-[18px] text-white" />}
      iconClassName="bg-[#2aabee]"
      label="Telegram"
      onClick={() => void startTelegramLogin()}
    />
  );
}
