import Link from 'next/link';
import { Logo } from './Logo';
import { NAV } from './Header';
import { contacts } from '@/lib/contacts';

export function Footer() {
  const c = contacts();
  return (
    <footer className="mt-16 bg-ink text-white/70">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">Экспорт автомобилей из Южной Кореи напрямую, без посредников. Подбор по всей Корее, осмотр, выкуп, растаможка и доставка до вашего дома.</p>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Разделы</div>
          <ul className="space-y-2 text-sm">
            {NAV.map((n) => <li key={n.href}><Link className="hover:text-lime" href={n.href}>{n.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Связь</div>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-lime" href={c.telegramUrl} target="_blank" rel="noopener">Telegram {c.telegram}</a></li>
            <li><a className="hover:text-lime" href={c.whatsappUrl} target="_blank" rel="noopener">WhatsApp</a></li>
            <li><a className="hover:text-lime" href={c.phoneHref}>{c.phone}</a></li>
            <li><a className="hover:text-lime" href={c.instagramUrl} target="_blank" rel="noopener">Instagram @picarboo</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} PICARBOO</span>
          <span className="max-w-3xl leading-relaxed">
            Данные об автомобилях — из открытых источников (encar.com) и обновляются автоматически. Расчёт стоимости предварительный и не является публичной офертой: итоговые таможенные платежи определяет таможня РФ по курсу на дату оформления.
          </span>
          <Link href="/privacy" className="hover:text-white">Политика конфиденциальности</Link>
        </div>
      </div>
    </footer>
  );
}
