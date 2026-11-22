import type { Metadata } from 'next';
import Link from 'next/link';
import { contacts } from '@/lib/contacts';

export const metadata: Metadata = { title: 'О нас', description: 'PICARBOO — экспорт автомобилей из Южной Кореи напрямую, без посредников.' };

export default function AboutPage() {
  const c = contacts();
  return (
    <div className="container-x py-10">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">О PICARBOO</h1>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-ink/75">
            <p>Мы работаем в Южной Корее и экспортируем автомобили напрямую: сами ищем машины на Encar, осматриваем, выкупаем и отправляем во Владивосток. Без перекупщиков и цепочки посредников между вами и продавцом.</p>
            <p>Возим Hyundai, Kia, Genesis и любые машины корейского рынка — BMW, Mercedes‑Benz, Audi, Porsche, Lexus и другие. Цена под ключ без комиссии сверху: в расчёте только стоимость авто, реальные расходы и таможня.</p>
            <p>Главное для нас — чтобы вы точно знали, что покупаете и сколько это будет стоить в итоге.</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/catalog" className="btn-dark">Выбрать авто</Link>
            <a href={c.instagramUrl} target="_blank" rel="noopener" className="btn-ghost">Instagram @picarboo</a>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[['Подбор', 'Ищем по всему Encar, проверяем историю и состояние'], ['Осмотр', 'Выезжаем к машине, снимаем видео, замеряем ЛКП'], ['Экспорт', 'Документы, выкуп, порт, судно до Владивостока'], ['Растаможка', 'Брокер, СБКТС, ЭПТС — до получения ключей']].map(([t, d]) => (
            <div key={t} className="card p-5"><div className="font-bold">{t}</div><p className="mt-1 text-sm text-ink/65">{d}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}
