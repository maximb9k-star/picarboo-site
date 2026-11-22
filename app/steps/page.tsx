import type { Metadata } from 'next';
import Link from 'next/link';
import { loadSettings } from '@/lib/settings';
import { loadRates } from '@/lib/rates';
import { krw, rub } from '@/lib/format';
import { contacts } from '@/lib/contacts';

export const metadata: Metadata = { title: 'Этапы покупки авто из Кореи', description: 'Как проходит покупка: выбор, осмотр, залог, выкуп, доставка во Владивосток и растаможка.' };
export const dynamic = 'force-dynamic';

export default async function StepsPage() {
  const s = await loadSettings();
  const rates = await loadRates().catch(() => null);
  const inRub = (v: number) => (rates ? ` (≈ ${rub(v / rates.rubKrwRemit)})` : '');
  const deposit = s.depositKrw ? `${krw(s.depositKrw)}${inRub(s.depositKrw)}` : null;
  const c = contacts();
  const steps: { title: string; body: React.ReactNode }[] = [
    { title: 'Выбираем автомобиль', body: <>Выберите машину в <Link href="/catalog" className="font-semibold underline">каталоге</Link> или пришлите ссылку с Encar — посчитаем цену под ключ и проверим историю. Можно просто написать модель и бюджет: подберём варианты сами.</> },
    { title: 'Вносите залог', body: <>Чтобы начать осмотры, вносите залог{deposit ? <> — <b>{deposit}</b></> : null}. Залог не теряется: при покупке он полностью идёт в счёт стоимости автомобиля.</> },
    { title: 'Осматриваем', body: <>Специалист выезжает к машине, проверяет кузов толщиномером, ходовую, двигатель и электронику, снимает всё на видео. При покупке до <b>{s.freeInspections} осмотров бесплатно</b>.</> },
    { title: 'Если передумали', body: <>Залог возвращаем за вычетом проведённых осмотров — <b>{krw(s.inspectionCostKrw)}</b>{inRub(s.inspectionCostKrw)} за каждый. Например, после трёх осмотров вернём залог минус {krw(s.inspectionCostKrw * 3)}.</> },
    { title: 'Договор и оплата', body: <>Фиксируем цену в договоре и выставляем инвойс на оставшуюся сумму (залог уже вычтен). Оплата — банковским переводом; растаможка оформляется на того, кто оплатил инвойс.</> },
    { title: 'Выкуп и подготовка к экспорту', body: <>Выкупаем машину у продавца, снимаем с учёта в Корее, готовим экспортные документы и бронируем место на судне.</> },
    { title: 'Доставка во Владивосток', body: <>Морем — около 2–3 дней. Пока судно в пути, брокер уже подаёт документы на таможню.</> },
    { title: 'Растаможка', body: <>Обычно 4–14 дней в зависимости от загрузки таможни. Таможенные платежи оплачиваются по курсу ЦБ на дату оформления — в расчёте на сайте они уже учтены.</> },
    { title: 'Получение', body: <>Забираете автомобиль во Владивостоке или отправляем в ваш город автовозом — поможем выбрать перевозчика.</> },
  ];
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Этапы покупки</h1>
      <p className="mt-3 max-w-2xl text-ink/65">От выбора до получения ключей — обычно 3–5 недель. На каждом этапе вы видите, что происходит с машиной.</p>
      <ol className="mt-8 grid gap-4 md:grid-cols-2">
        {steps.map((st, i) => (
          <li key={st.title} className="card flex gap-4 p-5">
            <div className="font-brand text-2xl text-lime-700">{String(i + 1).padStart(2, '0')}</div>
            <div>
              <div className="text-lg font-bold">{st.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">{st.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-2xl bg-ink p-6 text-white sm:flex sm:items-center sm:justify-between">
        <div className="text-lg font-bold">Остались вопросы по этапам?</div>
        <a href={c.telegramUrl} target="_blank" rel="noopener" className="btn-lime mt-4 sm:mt-0">Спросить в Telegram</a>
      </div>
    </div>
  );
}
