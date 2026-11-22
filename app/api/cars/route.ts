import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { CarCard } from '@/lib/catalog';

// Карточки по списку id — для страницы «Избранное».
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '')
    .split(',').map(Number).filter((n) => Number.isSafeInteger(n) && n > 0).slice(0, 200);
  if (!ids.length) return NextResponse.json({ cars: [] });
  const cars = await query<CarCard>(
    `select c.id, c.manufacturer, c.model, c.badge, c.fuel, c.year_month, c.mileage, c.displacement, null::int as hp, c.awd,
       c.price_krw, c.price_rub, c.photo_path, c.price_calc->>'ageGroup' as age_group,
       (c.price_calc->>'monthsToNextGroup')::int as months_to_next, c.accident_cnt, c.first_seen_at
     from cars c where c.id = any($1::bigint[])`,
    [ids],
  );
  return NextResponse.json({ cars });
}
