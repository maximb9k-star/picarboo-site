import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCar } from '@/lib/catalog';
import { photoUrl } from '@/lib/encar/client';
import { FUEL_LABEL } from '@/lib/encar/translate';
import { groupOptions } from '@/lib/encar/options';
import { carTitle, km, krw, rub, yearMonth, plural } from '@/lib/format';
import { getUser, loginBot } from '@/lib/session';
import { contacts } from '@/lib/contacts';
import { Gallery } from '@/components/Gallery';
import { PriceBox } from '@/components/PriceBox';
import { DamageScheme } from '@/components/DamageScheme';
import { LeadForm } from '@/components/LeadForm';
import { FavoriteButton } from '@/components/FavoriteButton';
import { TelegramLogin } from '@/components/TelegramLogin';
import { RateBadge } from '@/components/CarCard';
import { liveDetail, livePrice } from '@/lib/live';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

async function load(idRaw: string) {
  const id = Number(idRaw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return getCar(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await load((await params).id);
  if (!car) return { title: 'Автомобиль не найден' };
  const title = `${carTitle(car)}, ${Math.floor(car.year_month / 100)}`;
  return {
    title,
    description: `${title}, пробег ${km(car.mileage)}.${car.price_rub ? ` Под ключ до Владивостока ${rub(car.price_rub)}.` : ''} Авто из Кореи с Encar.`,
    openGraph: car.photo_path ? { images: [photoUrl(car.photo_path, 1200, 800)] } : undefined,
  };
}

export default async function CarPage({ params }: Props) {
  const { id } = await params;
  const car = await load(id);
  if (!car) notFound();
  const user = await getUser();
  const bot = await loginBot();
  const canLogin = !!bot;
  const unlocked = !!user || !canLogin; // пока вход не настроен — показываем всё
  const c = contacts();
  const title = carTitle(car);
  const [{ detail: live, gone }, priceCalc] = await Promise.all([liveDetail(car.id), livePrice(car)]);
  const photoPaths = live?.photos.length ? live.photos : car.photo_path ? [car.photo_path] : [];
  const photos = photoPaths.map((p) => photoUrl(p, 1024, 680));
  const rec = live?.detail.record ?? null;
  const ins = live?.detail.inspection ?? null;
  const options = groupOptions(live?.options ?? []);
  const vin = live?.vin ?? car.vin;
  const vehicleNo = live?.vehicle_no ?? car.vehicle_no;
  const active = car.active && !gone;
  const hpPending = car.spec_status === 'pending' && !car.hp;
  const tgText = encodeURIComponent(`Здравствуйте! Интересует ${title} (${car.price_rub ? rub(car.price_rub) : krw(car.price_krw)}): ${await siteUrl()}/car/${car.id}`);
  const locked = (v: React.ReactNode) => (unlocked ? v : <span className="text-ink/40">войдите, чтобы увидеть</span>);

  return (
    <div className="container-x py-6">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/catalog" className="hover:text-ink">Каталог</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/catalog?brand=${encodeURIComponent(car.manufacturer)}`} className="hover:text-ink">{car.manufacturer}</Link>
        {car.model_group && (
          <>
            <span className="mx-1.5">/</span>
            <Link href={`/catalog?brand=${encodeURIComponent(car.manufacturer)}&model=${encodeURIComponent(car.model_group)}`} className="hover:text-ink">{car.model_group}</Link>
          </>
        )}
      </nav>

      {!active && (
        <div className="mb-4 rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-900">Объявление снято с продажи на Encar. Подберём похожий автомобиль — напишите нам.</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink/60">
              <span>{yearMonth(car.year_month)}</span>·<span>{km(car.mileage)}</span>·<span>{FUEL_LABEL[car.fuel]}</span>
              <RateBadge group={car.age_group} monthsToNext={car.months_to_next} />
            </div>
          </div>
          <Gallery photos={photos} alt={title} />

          <Section title="Основные данные">
            <dl className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
              <Item k="Дата регистрации" v={yearMonth(car.year_month)} />
              <Item k="Модельный год" v={car.form_year ?? '—'} />
              <Item k="Пробег" v={km(car.mileage)} />
              <Item k="Топливо" v={FUEL_LABEL[car.fuel]} />
              <Item k="Объём двигателя" v={car.displacement && car.fuel !== 'electric' ? `${car.displacement.toLocaleString('ru-RU')} см³` : '—'} />
              <Item k="Мощность" v={locked(car.hp ? `${car.hp} л.с.` : 'уточняется')} />
              <Item k="Коробка" v={car.transmission ?? '—'} />
              <Item k="Привод" v={car.awd ? 'полный' : 'не указан'} />
              <Item k="Цвет" v={car.color ?? '—'} />
              <Item k="Кузов" v={car.body ?? '—'} />
              {car.seats ? <Item k="Мест" v={car.seats} /> : null}
              <Item k="VIN" v={locked(vin ? <span className="font-mono">{vin}</span> : '—')} />
              <Item k="Гос. номер" v={locked(vehicleNo ?? '—')} />
              {car.city ? <Item k="Где стоит" v={`Корея, ${car.city}`} /> : null}
            </dl>
            {!unlocked && canLogin && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-paper p-3">
                <span className="text-sm text-ink/70">VIN, гос. номер и мощность — после входа через Telegram</span>
                <TelegramLogin bot={bot!} next={`/car/${car.id}`} />
              </div>
            )}
          </Section>

          <Section title="Страховая история">
            {!live ? (
              <p className="text-sm text-ink/60">Не удалось загрузить историю с Encar — обновите страницу через минуту.</p>
            ) : rec ? (
              <div className="space-y-3 text-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat label="Страховые случаи" value={rec.myAccidentCnt + rec.otherAccidentCnt === 0 ? 'нет' : String(rec.myAccidentCnt + rec.otherAccidentCnt)} good={rec.myAccidentCnt + rec.otherAccidentCnt === 0} />
                  <Stat label="Выплаты по своему авто" value={rec.myAccidentCost ? krw(rec.myAccidentCost) : 'нет'} good={!rec.myAccidentCost} />
                  <Stat label="Смена владельцев" value={String(rec.ownerChangeCnt)} />
                </div>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  <Flag ok={rec.totalLoss === 0} text={rec.totalLoss === 0 ? 'Не было полной гибели' : 'Была полная гибель (тотал)'} />
                  <Flag ok={rec.flood === 0} text={rec.flood === 0 ? 'Не был затоплен' : 'Был затоплен'} />
                  <Flag ok={rec.robber === 0} text={rec.robber === 0 ? 'Не числился в угоне' : 'Числился в угоне'} />
                  <Flag ok={rec.business === 0} text={rec.business === 0 ? 'Не использовался в такси/прокате' : 'Использовался в коммерции (такси/прокат)'} />
                </ul>
                {rec.accidents.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] whitespace-nowrap text-left text-sm">
                      <thead className="text-xs uppercase text-ink/40">
                        <tr><th className="py-1.5">Дата</th><th>Чьё авто</th><th className="text-right">Выплата</th><th className="text-right">Детали</th><th className="text-right">Работа</th><th className="text-right">Окраска</th></tr>
                      </thead>
                      <tbody>
                        {rec.accidents.map((a, i) => (
                          <tr key={i} className="border-t border-ink/5">
                            <td className="py-1.5">{a.date}</td>
                            <td>{a.type === '3' ? 'другое авто' : 'это авто'}</td>
                            <td className="text-right">{krw(a.insuranceBenefit)}</td>
                            <td className="text-right">{krw(a.partCost)}</td>
                            <td className="text-right">{krw(a.laborCost)}</td>
                            <td className="text-right">{krw(a.paintingCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink/60">Продавец не открыл страховую историю. Запросим её при осмотре.</p>
            )}
          </Section>

          <Section title="Состояние кузова по листу осмотра">
            {ins ? (
              <>
                <DamageScheme parts={ins.parts} />
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className={`chip ${ins.accident ? 'bg-red-100 text-red-700' : 'bg-lime/30 text-ink'}`}>{ins.accident ? 'Повреждён силовой каркас' : 'Силовой каркас не повреждён'}</span>
                  {ins.simpleRepair && <span className="chip bg-amber-100 text-amber-800">Мелкий ремонт</span>}
                  {ins.waterlog && <span className="chip bg-red-100 text-red-700">Следы затопления</span>}
                  {ins.tuning && <span className="chip bg-ink/10">Тюнинг</span>}
                </div>
              </>
            ) : (
              <p className="text-sm text-ink/60">Лист осмотра не опубликован. Наш специалист осмотрит авто и пришлёт фото и видео.</p>
            )}
          </Section>

          {options.length > 0 && (
            <Section title={`Комплектация · ${options.reduce((a, g) => a + g.items.length, 0)} ${plural(options.reduce((a, g) => a + g.items.length, 0), 'опция', 'опции', 'опций')}`}>
              <div className="grid gap-5 sm:grid-cols-2">
                {options.map((g) => (
                  <div key={g.title}>
                    <div className="mb-2 text-sm font-bold">{g.title}</div>
                    <ul className="space-y-1 text-sm text-ink/75">
                      {g.items.map((o) => <li key={o} className="flex gap-2"><span className="text-lime-700">✓</span>{o}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <p className="text-xs text-ink/50">
            Объявление на Encar: <a className="underline" href={`https://fem.encar.com/cars/detail/${car.id}`} target="_blank" rel="noopener nofollow">fem.encar.com/cars/detail/{car.id}</a>
          </p>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <PriceBox calc={priceCalc} priceKrw={car.price_krw} hpPending={hpPending} />
          <div className="card space-y-2 p-5">
            <a href={`${c.telegramUrl}?text=${tgText}`} target="_blank" rel="noopener" className="btn-dark w-full">Написать в Telegram</a>
            <a href={`${c.whatsappUrl}?text=${tgText}`} target="_blank" rel="noopener" className="btn-ghost w-full">WhatsApp</a>
            <FavoriteButton id={car.id} large className="w-full" />
          </div>
          <div className="card p-5">
            <LeadForm carId={car.id} title="Заказать осмотр этого авто" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-extrabold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-ink/5 pb-2">
      <dt className="text-ink/55">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-xl bg-paper p-3">
      <div className="text-xs text-ink/50">{label}</div>
      <div className={`mt-0.5 text-base font-bold ${good ? 'text-lime-700' : ''}`}>{value}</div>
    </div>
  );
}

function Flag({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${ok ? 'bg-lime text-ink' : 'bg-red-500 text-white'}`}>{ok ? '✓' : '!'}</span>
      {text}
    </li>
  );
}
