import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/michroma';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const SITE = process.env.SITE_URL || 'https://picarboo.ru';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'PICARBOO — авто из Кореи под ключ', template: '%s — PICARBOO' },
  description: 'Каталог автомобилей с Encar с ценой под ключ до Владивостока: растаможка, утильсбор, доставка. Подбор, осмотр и выкуп в Корее без посредников.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-touch-icon.png' },
  openGraph: { siteName: 'PICARBOO', locale: 'ru_RU', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#0c0d0f', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
