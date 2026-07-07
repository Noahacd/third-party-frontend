import { fetchWithCookie } from '@/lib/request/http';

export type BackendTestResponse = {
  ok: boolean;
  message: string;
  timestamp: string;
  env: string;
};

export async function requestBackendTest() {
  return fetchWithCookie('/test');
}

export async function fetchBackendTest(): Promise<BackendTestResponse> {
  const response = await requestBackendTest();

  if (!response.ok) {
    throw new Error(`后端连接失败 (${response.status})`);
  }

  return response.json() as Promise<BackendTestResponse>;
}
