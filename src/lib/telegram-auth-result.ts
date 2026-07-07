import type { TelegramAuthData } from '@/types/telegram';

const TG_AUTH_RESULT_PREFIX = '#tgAuthResult=';

export function parseTelegramAuthResult(hash: string): TelegramAuthData | null {
  if (!hash.startsWith(TG_AUTH_RESULT_PREFIX)) {
    return null;
  }

  try {
    const encoded = hash.slice(TG_AUTH_RESULT_PREFIX.length);
    const json = atob(encoded);
    return JSON.parse(json) as TelegramAuthData;
  } catch {
    return null;
  }
}

export function hasTelegramAuthResult(hash: string) {
  return hash.startsWith(TG_AUTH_RESULT_PREFIX);
}
