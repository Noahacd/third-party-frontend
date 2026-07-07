import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AuthBootstrap } from '@/components/auth/AuthBootstrap';
import { LoginDialogHost } from '@/components/auth/LoginDialogHost';
import { SiteHeader } from '@/components/auth/SiteHeader';
import { TelegramAuthHandler } from '@/components/auth/TelegramAuthHandler';

import '@/app/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Third Party Login',
  description: 'Google, X and Telegram OAuth login demo with Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <AuthBootstrap />
        <TelegramAuthHandler />
        <SiteHeader />
        <LoginDialogHost />
        {children}
      </body>
    </html>
  );
}
