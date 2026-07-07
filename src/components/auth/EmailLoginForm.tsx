'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { EmailIcon } from '@/components/auth/LoginProviderIcons';
import { LoginOptionRow } from '@/components/auth/LoginOptionRow';
import { loginWithEmail, sendEmailCode } from '@/lib/request';
import { cn } from '@/lib/utils';

const SEND_COOLDOWN_SECONDS = 60;

type EmailLoginFormProps = {
  onSuccess?: () => void;
  redirectTo?: string;
};

export function EmailLoginForm({
  onSuccess,
  redirectTo = '/',
}: EmailLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSend = email.trim().length > 0 && !sending && cooldown === 0;
  const canVerify = code.length === 6 && !submitting;

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleSendCode() {
    if (!canSend) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendEmailCode(email);
      setCodeSent(true);
      setCooldown(SEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败');
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    if (!canVerify) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await loginWithEmail(email, code);
      onSuccess?.();
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitAction() {
    if (codeSent) {
      void handleVerify();
      return;
    }

    void handleSendCode();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmitAction();
    }
  }

  return (
    <div className="space-y-2">
      {!codeSent ? (
        <LoginOptionRow
          icon={
            <EmailIcon className="size-[18px] text-[#6b5ce7]" />
          }
          iconClassName="bg-[#f1efff]"
          trailing={
            <button
              type="button"
              disabled={!canSend}
              onClick={handleSubmitAction}
              className={cn(
                'shrink-0 px-1 text-[15px] font-medium transition-colors',
                canSend
                  ? 'text-[#6b5ce7] hover:text-[#5a4ad6]'
                  : 'cursor-not-allowed text-[#b8c0cc]'
              )}
            >
              {sending ? 'Sending...' : 'Submit'}
            </button>
          }
        >
          <input
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            value={email}
            disabled={sending}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={handleKeyDown}
            className="h-full w-full bg-transparent text-[15px] text-[#1f2937] outline-none placeholder:text-[#b8c0cc]"
          />
        </LoginOptionRow>
      ) : (
        <>
          <LoginOptionRow
            icon={
              <EmailIcon className="size-[18px] text-[#6b5ce7]" />
            }
            iconClassName="bg-[#f1efff]"
          >
            <p className="truncate text-[15px] text-[#6b7280]">{email}</p>
          </LoginOptionRow>

          <LoginOptionRow
            icon={
              <span className="text-sm font-semibold text-[#6b5ce7]">#</span>
            }
            iconClassName="bg-[#f1efff]"
            trailing={
              <button
                type="button"
                disabled={!canVerify}
                onClick={handleSubmitAction}
                className={cn(
                  'shrink-0 px-1 text-[15px] font-medium transition-colors',
                  canVerify
                    ? 'text-[#6b5ce7] hover:text-[#5a4ad6]'
                    : 'cursor-not-allowed text-[#b8c0cc]'
                )}
              >
                {submitting ? 'Signing in...' : 'Submit'}
              </button>
            }
          >
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={code}
              maxLength={6}
              disabled={submitting}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              onKeyDown={handleKeyDown}
              className="h-full w-full bg-transparent text-[15px] text-[#1f2937] outline-none placeholder:text-[#b8c0cc]"
            />
          </LoginOptionRow>

          <div className="flex items-center justify-between px-1 text-xs text-[#9aa3b2]">
            <button
              type="button"
              className="hover:text-[#6b5ce7]"
              disabled={submitting}
              onClick={() => {
                setCodeSent(false);
                setCode('');
                setCooldown(0);
                setError(null);
              }}
            >
              Change email
            </button>
            <button
              type="button"
              className="hover:text-[#6b5ce7] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={cooldown > 0 || sending}
              onClick={() => void handleSendCode()}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}

      {error ? (
        <p className="px-1 text-sm text-[#e5484d]">{error}</p>
      ) : null}
    </div>
  );
}
