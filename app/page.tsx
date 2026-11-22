import Link from 'next/link';
import { catalogStats, latestCars, facetManufacturers } from '@/lib/catalog';
import { CarCard } from '@/components/CarCard';
import { LogoMark } from '@/components/Logo';
import { LeadForm } from '@/components/LeadForm';
import { QuickSearch } from '@/components/QuickSearch';
import { contacts } from '@/lib/contacts';
import { ADVANTAGES, STEPS_SHORT } from '@/lib/content';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [stats, cars, brands] = await Promise.all([catalogStats(), latestCars(8), facetManufacturers()]);
  const c = contacts();
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 opacity-[.07]"><LogoMark className="h-[420px] w-auto" /></div>
        <div className="container-x relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <span className="chip bg-lime/15 text-lime">🇰🇷 Экспортёр авто из Кореи напрямую</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Авто из Кореи<br /><span className="text-lime">под ключ</span> без комиссии
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Весь рынок Encar с честной ценой до Владивостока: растаможка, утильсбор и доставка уже посчитаны. Осматриваем, выкупаем и отправляем сами.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/catalog" className="btn-lime px-6 py-3.5 text-base">Смотреть каталог</Link>
              <a href={c.telegramUrl} target="_blank" rel="noopener" className="btn border border-white/20 px-6 py-3.5 text-base text-white hover:bg-white/5">Напиши модель — посчитаю</a>
            </div>
            <div className="mt-9 grid max-w-md grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-extrabold text-lime">{stats.total.toLocaleString('ru-RU')}</div>
                <div className="text-sm text-white/50">авто в каталоге</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold">+{stats.today.toLocaleString('ru-RU')}</div>
                <div className="text-sm text-white/50">новых за сутки</div>
              </div>
            </div>
          </div>
          <div className="lg:pl-6">
            <QuickSearch brands={brands.slice(0, 60)} />
          </div>
        </div>
      </section>

      <section className="container-x -mt-px py-12">
        <h2 className="h-section">Почему с нами</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((a) => (
            <div key={a.title} className="card p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-xl text-lime">{a.icon}</div>
              <div className="mt-4 font-bold">{a.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      {cars.length > 0 && (
        <section className="container-x py-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="h-section">Свежие предложения</h2>
            <Link href="/catalog" className="text-sm font-semibold text-ink/70 hover:text-ink">Весь каталог →</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cars.map((car) => <CarCard key={car.id} car={car} />)}
          </div>
        </section>
      )}

      <section className="container-x py-12">
        <div className="rounded-3xl bg-ink p-6 text-white sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="h-section">Как привезти авто</h2>
            <Link href="/steps" className="text-sm font-semibold text-lime hover:underline">Все этапы подробно →</Link>
          </div>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS_SHORT.map((s, i) => (
              <li key={s.title}>
                <div className="font-brand text-3xl text-lime">0{i + 1}</div>
                <div className="mt-2 font-bold">{s.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-white/60">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x grid gap-6 py-6 lg:grid-cols-2">
        <div className="card p-6 sm:p-8">
          <h2 className="h-section">Не нашли подходящее?</h2>
          <p className="mt-2 text-ink/65">Напишите модель и бюджет — подберём варианты на Encar, пришлём расчёт под ключ и проверим историю каждой машины.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={c.telegramUrl} target="_blank" rel="noopener" className="btn-dark">Telegram {c.telegram}</a>
            <a href={c.whatsappUrl} target="_blank" rel="noopener" className="btn-ghost">WhatsApp</a>
          </div>
        </div>
        <div className="card p-6 sm:p-8">
          <LeadForm title="Оставить заявку на подбор" />
        </div>
      </section>
    </>
  );
}
