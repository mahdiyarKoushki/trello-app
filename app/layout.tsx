import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trello Clone - Kanban Board',
  description:
    'A Trello-inspired Kanban board built with Next.js, TypeScript, and SCSS.',
};

export const viewport: Viewport = {
  themeColor: '#0079bf',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
