import Link from 'next/link';
import type { CarCard as Car } from '@/lib/catalog';
import { photoUrl } from '@/lib/encar/client';
import { FUEL_LABEL } from '@/lib/encar/translate';
import { carTitle, km, rub, yearMonth, plural } from '@/lib/format';
import { FavoriteButton } from './FavoriteButton';

export function RateBadge({ group, monthsToNext }: { group: string | null; monthsToNext: number | null }) {
  if (!group) return null;
  if (group === '3to5') {
    return <span className="chip bg-lime/90 text-ink">Проходной</span>;
  }
  if (group === 'lt3' && monthsToNext != null && monthsToNext <= 6) {
    return <span className="chip bg-ink text-lime">Проходной через {monthsToNext} {plural(monthsToNext, 'месяц', 'месяца', 'месяцев')}</span>;
  }
  return <span className="chip bg-ink/80 text-white">Высокая ставка</span>;
}

export function CarCard({ car }: { car: Car }) {
  const specs = [
    FUEL_LABEL[car.fuel],
    car.displacement && car.fuel !== 'electric' ? `${car.displacement.toLocaleString('ru-RU')} см³` : null,
    car.awd ? 'полный привод' : null,
  ].filter(Boolean).join(', ');
  const isNew = Date.now() - new Date(car.first_seen_at).getTime() < 24 * 3600 * 1000;
  return (
    <Link href={`/car/${car.id}`} className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[3/2] overflow-hidden bg-ink/5">
        {car.photo_path ? (
          <img src={photoUrl(car.photo_path)} alt={carTitle(car)} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : null}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {isNew && <span className="chip bg-white text-ink">Новое</span>}
          <RateBadge group={car.age_group} monthsToNext={car.months_to_next} />
        </div>
        <FavoriteButton id={car.id} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug">{carTitle(car)}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-ink/60">{specs}</p>
        <p className="mt-0.5 text-sm text-ink/60">{yearMonth(car.year_month)} · {km(car.mileage)}</p>
        <div className="mt-auto pt-3">
          {car.price_rub ? (
            <>
              <div className="text-xl font-extrabold tracking-tight">{rub(car.price_rub)}</div>
              <div className="text-xs text-ink/50">под ключ до Владивостока</div>
            </>
          ) : (
            <>
              <div className="text-base font-bold text-ink/70">Цена уточняется</div>
              <div className="text-xs text-ink/50">уточняем мощность для расчёта</div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
