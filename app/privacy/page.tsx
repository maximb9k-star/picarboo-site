import type { Metadata } from 'next';
import { contacts } from '@/lib/contacts';

export const metadata: Metadata = { title: 'Политика конфиденциальности', robots: { index: false } };

export default function PrivacyPage() {
  const c = contacts();
  const operator = process.env.NEXT_PUBLIC_LEGAL_NAME || 'PICARBOO (Республика Корея)';
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Политика конфиденциальности</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/75">
        <p>Оператор персональных данных — {operator} (далее — «мы»). Политика описывает, какие данные мы получаем через сайт и как их используем.</p>
        <h2 className="pt-2 text-lg font-bold text-ink">Какие данные мы получаем</h2>
        <p>Имя, телефон или ник в мессенджере и комментарий — из формы заявки. При входе через Telegram — ваш идентификатор, имя, ник и фото профиля Telegram. Технические данные: cookie для входа и настройки браузера (избранное хранится только в вашем браузере).</p>
        <h2 className="pt-2 text-lg font-bold text-ink">Зачем</h2>
        <p>Чтобы связаться с вами по заявке, подобрать и рассчитать автомобиль, заключить и исполнить договор. Мы не передаём данные третьим лицам, кроме случаев, когда это нужно для исполнения договора (перевозчик, таможенный брокер) или требуется по закону.</p>
        <h2 className="pt-2 text-lg font-bold text-ink">Сроки и права</h2>
        <p>Храним данные, пока это нужно для целей обработки, но не дольше 3 лет с последнего обращения. Вы можете запросить сведения о ваших данных, их исправление или удаление, а также отозвать согласие — напишите нам в Telegram {c.telegram}.</p>
        <h2 className="pt-2 text-lg font-bold text-ink">Согласие</h2>
        <p>Отправляя заявку, вы соглашаетесь на обработку указанных данных на условиях этой политики.</p>
      </div>
    </div>
  );
}
