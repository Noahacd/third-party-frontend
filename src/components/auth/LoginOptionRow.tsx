import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type LoginOptionRowProps = {
  icon: ReactNode;
  iconClassName?: string;
  label?: string;
  children?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export function LoginOptionRow({
  icon,
  iconClassName,
  label,
  children,
  trailing,
  onClick,
  disabled,
  className,
}: LoginOptionRowProps) {
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-14 w-full items-center gap-3 rounded-2xl border border-[#e3e8f0] bg-white px-3 text-left transition-colors',
        onClick &&
          'cursor-pointer hover:border-[#d5ddea] hover:bg-[#fcfdff] disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-[10px]',
          iconClassName
        )}
      >
        {icon}
      </div>

      {children ?? (
        <span className="flex-1 text-[15px] font-medium text-[#1f2937]">
          {label}
        </span>
      )}

      {trailing}
    </Comp>
  );
}
