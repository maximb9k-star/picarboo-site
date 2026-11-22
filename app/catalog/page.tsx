import type { Metadata } from 'next';
import Link from 'next/link';
import { searchCars, facetManufacturers, facetSimple, PAGE_SIZE, SORTS } from '@/lib/catalog';
import { parseFilters, toQuery, type Params } from '@/lib/filters';
import { CarCard } from '@/components/CarCard';
import { Filters } from '@/components/Filters';
import { SortSelect } from '@/components/SortSelect';
import { plural } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const p = await searchParams;
  const parts = [p.brand, p.model].filter(Boolean).join(' ');
  return {
    title: parts ? `${parts} из Кореи — цены под ключ` : 'Каталог авто из Кореи',
    description: 'Автомобили с Encar с полной ценой под ключ до Владивостока: растаможка, утильсбор, доставка.',
  };
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { filters, sort, page } = parseFilters(params);
  const [{ cars, total }, manufacturers, colors, bodies] = await Promise.all([
    searchCars(filters, sort, page),
    facetManufacturers(),
    facetSimple('color'),
    facetSimple('body'),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const initial: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (typeof v === 'string' && v) initial[k] = v;

  return (
    <div className="container-x py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Авто из Кореи</h1>
          <p className="mt-1 text-sm text-ink/60">
            {total.toLocaleString('ru-RU')} {plural(total, 'автомобиль', 'автомобиля', 'автомобилей')} с Encar · цена под ключ до Владивостока
          </p>
        </div>
        <SortSelect value={sort} options={SORTS} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <Filters initial={initial} manufacturers={manufacturers} colors={colors} bodies={bodies} />
        </div>
        <div>
          {cars.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-lg font-semibold">Ничего не нашлось</p>
              <p className="mt-1 text-sm text-ink/60">Ослабьте фильтры или напишите нам — подберём вручную.</p>
              <Link href="/catalog" className="btn-dark mt-5">Сбросить фильтры</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cars.map((c) => <CarCard key={c.id} car={c} />)}
            </div>
          )}
          {pages > 1 && <Pagination page={page} pages={pages} params={params} />}
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, pages, params }: { page: number; pages: number; params: Params }) {
  const nums = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2].filter((n) => n >= 1 && n <= pages));
  const list = [...nums].sort((a, b) => a - b);
  const href = (n: number) => `/catalog${toQuery(params, { page: n > 1 ? String(n) : undefined })}`;
  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Страницы">
      {page > 1 && <Link className="btn-ghost !px-3 !py-2" href={href(page - 1)}>←</Link>}
      {list.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - list[i - 1]! > 1 && <span className="px-1 text-ink/40">…</span>}
          <Link href={href(n)} className={`min-w-10 rounded-xl px-3 py-2 text-center text-sm font-semibold ${n === page ? 'bg-ink text-lime' : 'bg-white text-ink hover:bg-ink/5'}`}>{n}</Link>
        </span>
      ))}
      {page < pages && <Link className="btn-ghost !px-3 !py-2" href={href(page + 1)}>→</Link>}
    </nav>
  );
}
