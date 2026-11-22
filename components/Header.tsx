import Link from 'next/link';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { contacts } from '@/lib/contacts';

export const NAV = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/steps', label: 'Этапы' },
  { href: '/guarantees', label: 'Гарантии' },
  { href: '/about', label: 'О нас' },
  { href: '/contacts', label: 'Контакты' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/95 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="PICARBOO — на главную"><Logo /></Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/5 hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/favorites" className="hidden rounded-lg p-2 text-white/75 hover:bg-white/5 hover:text-white sm:block" aria-label="Избранное">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.3 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.7 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" /></svg>
          </Link>
          <a href={contacts().telegramUrl} target="_blank" rel="noopener" className="btn-lime hidden !py-2 sm:inline-flex">Написать в Telegram</a>
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
