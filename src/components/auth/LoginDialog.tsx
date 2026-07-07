'use client';

import { EmailLoginForm } from '@/components/auth/EmailLoginForm';
import {
  GoogleIcon,
  XIcon,
} from '@/components/auth/LoginProviderIcons';
import { LoginOptionRow } from '@/components/auth/LoginOptionRow';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { startGoogleLogin, startXLogin } from '@/lib/request';

type LoginDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="gap-5 border-0 bg-[#f7f8fa] p-6 shadow-xl sm:max-w-[420px]">
        <DialogTitle className="text-center text-[28px] leading-tight font-bold tracking-tight text-[#111827]">
          欢迎来到WINWORLD
        </DialogTitle>

        <div className="space-y-3">
          <EmailLoginForm onSuccess={() => onOpenChange(false)} />

          <LoginOptionRow
            icon={<GoogleIcon className="size-5" />}
            iconClassName="bg-white"
            label="Google"
            onClick={startGoogleLogin}
          />

          <LoginOptionRow
            icon={<XIcon className="size-4 text-white" />}
            iconClassName="bg-black"
            label="Twitter"
            onClick={startXLogin}
          />

          <TelegramLoginButton />
        </div>
      </DialogContent>
    </Dialog>
  );
}
