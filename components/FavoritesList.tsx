'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readFavorites } from '@/lib/favorites';
import { photoUrl } from '@/lib/encar/client';
import { carTitle, km, rub, yearMonth } from '@/lib/format';
import type { CarCard } from '@/lib/catalog';
import { FavoriteButton } from './FavoriteButton';

export function FavoritesList() {
  const [cars, setCars] = useState<CarCard[] | null>(null);
  useEffect(() => {
    const ids = readFavorites();
    if (!ids.length) { setCars([]); return; }
    void fetch(`/api/cars?ids=${ids.join(',')}`).then((r) => r.json()).then((d: { cars: CarCard[] }) => {
      const order = new Map(ids.map((id, i) => [id, i]));
      setCars(d.cars.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)));
    });
  }, []);
  if (cars == null) return <p className="text-ink/50">Загружаем…</p>;
  if (!cars.length) {
    return (
      <div className="card p-10 text-center">
        <p className="font-semibold">Здесь пока пусто</p>
        <p className="mt-1 text-sm text-ink/60">Нажимайте ♡ на карточках, чтобы сохранить машины.</p>
        <Link href="/catalog" className="btn-dark mt-5">В каталог</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cars.map((c) => (
        <Link key={c.id} href={`/car/${c.id}`} className="card relative overflow-hidden">
          {c.photo_path && <img src={photoUrl(c.photo_path)} alt="" referrerPolicy="no-referrer" className="aspect-[3/2] w-full object-cover" />}
          <FavoriteButton id={c.id} className="absolute right-2 top-2" />
          <div className="p-4">
            <div className="line-clamp-2 font-bold">{carTitle(c)}</div>
            <div className="mt-1 text-sm text-ink/60">{yearMonth(c.year_month)} · {km(c.mileage)}</div>
            <div className="mt-2 text-lg font-extrabold">{c.price_rub ? rub(c.price_rub) : 'Цена уточняется'}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
