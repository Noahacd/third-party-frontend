'use client';

import { LoginDialog } from '@/components/auth/LoginDialog';
import { useUiStore } from '@/store/ui';

export function LoginDialogHost() {
  const loginOpen = useUiStore((state) => state.loginOpen);
  const setLoginOpen = useUiStore((state) => state.setLoginOpen);

  return <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />;
}
