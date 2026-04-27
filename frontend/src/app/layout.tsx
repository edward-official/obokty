import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ObokTy — Zawsze Obok Ty',
  description: '국제 커플을 위한 실시간 언어 학습 퀴즈 게임. Always by your side.',
  keywords: ['language learning', 'couple game', 'polish korean', 'quiz'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
