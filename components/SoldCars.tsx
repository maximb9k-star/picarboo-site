import Image from 'next/image';
import { SOLD_CARS } from '@/lib/sold';

// Блок с фото выкупленных автомобилей. Пока фото нет — не показывается.
export function SoldCars({ limit }: { limit?: number }) {
  const cars = limit ? SOLD_CARS.slice(0, limit) : SOLD_CARS;
  if (!cars.length) return null;
  return (
    <section className="container-x py-10">
      <h2 className="h-section">Наши выкупленные автомобили</h2>
      <p className="mt-2 text-ink/65">Машины, которые мы выкупили в Корее и доставили клиентам. Номера скрыты.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((c) => (
          <figure key={c.photo} className="card overflow-hidden">
            <div className="relative aspect-[4/3] bg-paper">
              <Image src={c.photo} alt={c.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
            </div>
            <figcaption className="p-4">
              <div className="font-bold">{c.title}{c.year ? `, ${c.year}` : ''}</div>
              {c.city && <div className="text-sm text-ink/60">Доставлен в {c.city}</div>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
