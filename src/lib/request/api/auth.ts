import {
  fetchAuthSessionFromApi,
  requestAuthMe,
  requestEmailSendCode,
  requestEmailVerify,
  requestLogout,
  requestTelegramAuth,
  requestTelegramConfig,
} from '@/lib/request/api/auth.requests';
import { getApiUrl, parseSessionResponse } from '@/lib/request/http';
import { useAuthStore } from '@/store/auth';
import type { AuthUser } from '@/types/auth';
import type { TelegramAuthData, TelegramConfig } from '@/types/telegram';

const REQUIRE_REAUTH_KEY = 'auth.require_reauth';

export {
  bootstrapAuthSession,
  requestAuthMe,
  requestAuthRefresh,
  requestLogout,
} from '@/lib/request/api/auth.requests';

export async function refreshAuthSession() {
  const session = await fetchAuthSessionFromApi();
  useAuthStore.getState().setSession(session);
  return session;
}

export async function loadAuthSession() {
  return useAuthStore.getState().ensureSession();
}

export async function fetchAuthSession() {
  return loadAuthSession();
}

export function getGoogleLoginUrl(forceReauth = false) {
  const url = getApiUrl('/auth/google');
  return forceReauth ? `${url}?reauth=1` : url;
}

export function getXLoginUrl(forceReauth = false) {
  const url = getApiUrl('/auth/x');
  return forceReauth ? `${url}?reauth=1` : url;
}

export function startGoogleLogin() {
  const forceReauth = sessionStorage.getItem(REQUIRE_REAUTH_KEY) === '1';
  sessionStorage.removeItem(REQUIRE_REAUTH_KEY);
  window.location.href = getGoogleLoginUrl(forceReauth);
}

export function startXLogin() {
  const forceReauth = sessionStorage.getItem(REQUIRE_REAUTH_KEY) === '1';
  sessionStorage.removeItem(REQUIRE_REAUTH_KEY);
  window.location.href = getXLoginUrl(forceReauth);
}

export async function fetchTelegramConfig(): Promise<TelegramConfig | null> {
  const response = await requestTelegramConfig();
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as TelegramConfig;
}

export async function startTelegramLogin() {
  const config = await fetchTelegramConfig();
  if (!config?.loginUrl) {
    throw new Error('Telegram login is not configured');
  }

  window.location.href = config.loginUrl;
}

export async function loginWithTelegram(data: TelegramAuthData) {
  const response = await requestTelegramAuth(data);
  const session = await parseSessionResponse(response);

  if (!session) {
    throw new Error('Telegram login failed');
  }

  useAuthStore.getState().setSession(session);
  return session;
}

const EMAIL_ERROR_MESSAGES: Record<string, string> = {
  invalid_email: '请输入有效的邮箱地址',
  send_too_frequent: '发送过于频繁，请稍后再试',
  email_not_configured: '邮件服务未配置',
  send_failed: '验证码发送失败，请稍后重试',
  invalid_request: '请求参数无效',
  invalid_or_expired_code: '验证码错误或已过期',
  too_many_attempts: '尝试次数过多，请重新获取验证码',
};

async function parseEmailError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
    detail?: string;
  } | null;
  const key = data?.error ?? '';
  if (data?.detail) {
    return data.detail;
  }
  return EMAIL_ERROR_MESSAGES[key] ?? fallback;
}

export async function sendEmailCode(email: string) {
  const response = await requestEmailSendCode(email);

  if (!response.ok) {
    throw new Error(
      await parseEmailError(response, '验证码发送失败，请稍后重试')
    );
  }
}

export async function loginWithEmail(email: string, code: string) {
  const response = await requestEmailVerify(email, code);

  if (!response.ok) {
    throw new Error(
      await parseEmailError(response, '登录失败，请检查验证码后重试')
    );
  }

  const session = await parseSessionResponse(response);

  if (!session) {
    throw new Error('登录失败，请检查验证码后重试');
  }

  useAuthStore.getState().setSession(session);
  return session;
}

export async function fetchUserInfo(): Promise<AuthUser | null> {
  await useAuthStore.getState().ensureSession();

  const accessToken = useAuthStore.getState().session?.accessToken;
  const response = await requestAuthMe(
    accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}
  );
  const session = await parseSessionResponse(response);

  useAuthStore.getState().setSession(session);
  return session?.user ?? null;
}

export async function logout() {
  const response = await requestLogout();

  if (!response.ok) {
    throw new Error('Failed to logout');
  }

  useAuthStore.getState().clearSession();
  sessionStorage.setItem(REQUIRE_REAUTH_KEY, '1');
}
