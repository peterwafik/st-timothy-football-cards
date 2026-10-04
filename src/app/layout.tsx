import type { Metadata } from 'next';
import { Barlow_Condensed, Big_Shoulders } from 'next/font/google';
import './globals.css';

const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-barlow' });
const stadium = Big_Shoulders({ subsets: ['latin'], variable: '--font-big-shoulders' });

export const metadata: Metadata = { title: 'St. Timothy Cards', description: 'St. Timothy Sunday School football cards' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${stadium.variable}`}>
      <body className="min-h-dvh bg-pitch text-white antialiased">{children}</body>
    </html>
  );
}
