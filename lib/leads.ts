// Заявки: проверка, сохранение и отправка вам в Telegram.
import { z } from 'zod';
import { query } from './db';
import { notifyAdmin, escapeHtml } from './telegram';
import { carTitle, rub } from './format';

export const leadSchema = z.object({
  name: z.string().trim().max(100).optional().default(''),
  contact: z.string().trim().min(3, 'Укажите телефон или ник').max(100),
  method: z.enum(['telegram', 'whatsapp', 'phone']),
  carId: z.number().int().positive().optional(),
  comment: z.string().trim().max(1000).optional().default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'Нужно согласие на обработку данных' }) }),
});

export type LeadInput = z.infer<typeof leadSchema>;

const METHOD_LABEL = { telegram: 'Telegram', whatsapp: 'WhatsApp', phone: 'Телефон' } as const;

export async function createLead(input: LeadInput, userId: number | null, siteUrl: string): Promise<{ id: number; delivered: boolean }> {
  const [row] = await query<{ id: number }>(
    `insert into leads (name, contact, contact_method, car_id, comment, user_id) values ($1, $2, $3, $4, $5, $6) returning id`,
    [input.name || null, input.contact, input.method, input.carId ?? null, input.comment || null, userId],
  );
  let carLine = '';
  if (input.carId) {
    const [car] = await query<{ manufacturer: string; model: string; badge: string | null; price_rub: number | null; price_krw: number }>(
      'select manufacturer, model, badge, price_rub, price_krw from cars where id = $1', [input.carId],
    );
    if (car) {
      carLine = `\n🚗 <b>${escapeHtml(carTitle(car))}</b>\n${car.price_rub ? `Под ключ: ${rub(car.price_rub)}\n` : ''}${siteUrl}/car/${input.carId}\nEncar: https://fem.encar.com/cars/detail/${input.carId}`;
    }
  }
  const text = [
    `📩 <b>Заявка №${row!.id}</b>`,
    input.name ? `Имя: ${escapeHtml(input.name)}` : '',
    `${METHOD_LABEL[input.method]}: <code>${escapeHtml(input.contact)}</code>`,
    input.comment ? `Комментарий: ${escapeHtml(input.comment)}` : '',
  ].filter(Boolean).join('\n') + carLine;
  const delivered = await notifyAdmin(text);
  if (delivered) await query('update leads set delivered = true where id = $1', [row!.id]);
  return { id: row!.id, delivered };
}
