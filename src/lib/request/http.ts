import type { AuthSession } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

const SESSION_FETCH_TIMEOUT_MS = 10_000;

export function getApiUrl(path: string) {
  return `${API_URL}${path}`;
}

export async function parseSessionResponse(
  response: Response
): Promise<AuthSession | null> {
  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch auth session (${response.status})`);
  }

  let data: {
    user?: AuthSession['user'];
    accessToken?: string;
  };

  try {
    data = (await response.json()) as {
      user: AuthSession['user'];
      accessToken: string;
    };
  } catch {
    throw new Error('Invalid auth session response');
  }

  if (!data.user || !data.accessToken) {
    throw new Error('Invalid auth session response');
  }

  return {
    user: data.user,
    accessToken: data.accessToken,
  };
}

export async function fetchWithCookie(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    SESSION_FETCH_TIMEOUT_MS
  );

  try {
    return await fetch(getApiUrl(path), {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
