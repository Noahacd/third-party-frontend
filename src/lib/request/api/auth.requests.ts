import { fetchWithCookie, parseSessionResponse } from '@/lib/request/http';
import type { AuthSession } from '@/types/auth';
import type { TelegramAuthData } from '@/types/telegram';

export async function requestAuthMe(init: RequestInit = {}) {
  return fetchWithCookie('/auth/me', init);
}

export async function requestAuthRefresh() {
  return fetchWithCookie('/auth/refresh', { method: 'POST' });
}

export async function requestLogout() {
  return fetchWithCookie('/auth/logout', { method: 'POST' });
}

export async function bootstrapAuthSession(): Promise<AuthSession | null> {
  try {
    const response = await requestAuthMe();

    if (response.status === 401) {
      const refreshResponse = await requestAuthRefresh();
      return parseSessionResponse(refreshResponse);
    }

    return parseSessionResponse(response);
  } catch {
    return null;
  }
}

export async function fetchAuthSessionFromApi(): Promise<AuthSession | null> {
  return parseSessionResponse(await requestAuthRefresh());
}

export async function requestTelegramConfig() {
  return fetchWithCookie('/auth/telegram/config');
}

export async function requestTelegramAuth(data: TelegramAuthData) {
  return fetchWithCookie('/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function requestEmailSendCode(email: string) {
  return fetchWithCookie('/auth/email/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export async function requestEmailVerify(email: string, code: string) {
  return fetchWithCookie('/auth/email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
}
