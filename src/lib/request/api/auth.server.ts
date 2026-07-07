import type { NextRequest } from 'next/server';

export async function requestAuthMeOnServer(request: NextRequest) {
  const meUrl = new URL('/api/auth/me', request.url);

  return fetch(meUrl, {
    headers: {
      cookie: request.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  });
}
