import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'מכבי סדנאות - לחיות חיים בריאים יותר',
  description: 'הכירו את מגוון הסדנאות של מכבי לאורח חיים בריא: תזונה, גמילה מעישון, קשר משפחתי, ניהול סוכרת וגיל שלישי',
  keywords: 'מכבי, סדנאות, אורח חיים בריא, תזונה, גמילה מעישון, סוכרת',
  openGraph: {
    title: 'מכבי סדנאות',
    description: 'לחיות חיים בריאים יותר – זה הכול',
    locale: 'he_IL',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
