import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SAKE CALENDAR - 東京近郊のお酒イベントスケジュール管理',
  description: '東京近郊で開催されるお酒に関するイベント（日本酒、ビール、ワイン、ウイスキー、フェス等）の情報をまとめたカレンダー。ジャンルやエリアで簡単に絞り込みが可能です。',
  keywords: ['お酒', 'イベント', 'カレンダー', '日本酒', 'ビール', 'ワイン', 'ウイスキー', 'フェス', '東京近郊'],
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}
