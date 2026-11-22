import type { Metadata } from 'next';
import { ADVANTAGES } from '@/lib/content';
import { LeadForm } from '@/components/LeadForm';

export const metadata: Metadata = { title: 'Гарантии', description: 'Фиксированная цена в договоре, прозрачный расчёт, контроль сделки и юридическая проверка автомобиля.' };

const DETAILS = [
  { title: 'Договор с фиксированной ценой', text: 'Стоимость автомобиля и все расходы до Владивостока фиксируются в договоре и не растут по ходу сделки. Таможенные платежи начисляет таможня по курсу ЦБ на дату оформления — в расчёте они уже учтены по текущему курсу.' },
  { title: 'Расчёт можно проверить', text: 'На каждой машине — цена на Encar, курс, расходы и таможенные платежи построчно. Пошлина и утильсбор — по действующим ставкам таможни РФ.' },
  { title: 'Независимый осмотр', text: 'Осматриваем до покупки, а не после: толщиномер по всем элементам, диагностика, тест‑драйв, видео в высоком качестве. Не понравилось — ищем дальше.' },
  { title: 'Проверка истории', text: 'Страховые выплаты, ДТП, затопления, угон, использование в такси и прокате, залоги и ограничения — по базам Кореи.' },
  { title: 'Залог засчитывается в цену', text: 'Залог полностью идёт в стоимость автомобиля. Если решите не покупать — вернём его за вычетом только проведённых осмотров.' },
  { title: 'Отслеживание доставки', text: 'Сообщаем статус на каждом этапе: выкуп, порт, судно, СВХ, растаможка, отправка в ваш город.' },
];

export default function GuaranteesPage() {
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Гарантии</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ADVANTAGES.map((a) => (
          <div key={a.title} className="rounded-2xl bg-ink p-5 text-white">
            <div className="text-2xl text-lime">{a.icon}</div>
            <div className="mt-3 font-bold">{a.title}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {DETAILS.map((d) => (
          <div key={d.title} className="card p-6">
            <div className="text-lg font-bold">{d.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{d.text}</p>
          </div>
        ))}
      </div>
      <div className="card mx-auto mt-10 max-w-xl p-6"><LeadForm title="Задать вопрос" /></div>
    </div>
  );
}
