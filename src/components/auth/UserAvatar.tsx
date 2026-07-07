'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserAvatarProps = {
  name: string;
  picture?: string;
  size?: 'default' | 'sm' | 'lg';
};

export function UserAvatar({
  name,
  picture,
  size = 'default',
}: UserAvatarProps) {
  return (
    <Avatar size={size}>
      {picture ? (
        <AvatarImage
          src={picture}
          alt={name}
          referrerPolicy="no-referrer"
        />
      ) : null}
      <AvatarFallback>{name?.charAt(0) ?? '?'}</AvatarFallback>
    </Avatar>
  );
}
