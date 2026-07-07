import { refreshAuthSession } from '@/lib/request/api/auth';
import { getApiUrl } from '@/lib/request/http';
import { getAccessToken, useAuthStore } from '@/store/auth';

function buildRequestInit(init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return {
    ...init,
    headers,
    credentials: 'include' as RequestCredentials,
    cache: init.cache ?? ('no-store' as RequestCache),
  };
}

async function request(path: string, init: RequestInit = {}) {
  return fetch(getApiUrl(path), buildRequestInit(init));
}

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  if (typeof window !== 'undefined') {
    await useAuthStore.getState().ensureSession();
  }

  let response = await request(path, init);

  if (response.status === 401 && !path.startsWith('/auth/')) {
    const session = await refreshAuthSession();
    if (!session) {
      useAuthStore.getState().clearSession();
      return response;
    }

    response = await request(path, init);
  }

  return response;
}
