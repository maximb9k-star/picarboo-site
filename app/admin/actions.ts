'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { sign, isAdmin, COOKIE_NAMES } from '@/lib/session';
import { saveSetting } from '@/lib/settings';
import { query } from '@/lib/db';

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').replace(/[\s₩₽,]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export async function login(form: FormData): Promise<void> {
  const pass = String(form.get('password') ?? '');
  const expected = process.env.ADMIN_PASSWORD ?? '';
  const ok = expected.length > 0 && pass.length === expected.length && crypto.timingSafeEqual(Buffer.from(pass), Buffer.from(expected));
  if (!ok) redirect('/admin?error=1');
  (await cookies()).set(COOKIE_NAMES.admin, sign({ admin: true, exp: Math.floor(Date.now() / 1000) + 7 * 86400 }), {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 86400,
  });
  redirect('/admin');
}

export async function logout(): Promise<void> {
  (await cookies()).delete(COOKIE_NAMES.admin);
  redirect('/admin');
}

async function guard(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin');
}

export async function saveSettings(form: FormData): Promise<void> {
  await guard();
  const korea = intOrNull(form.get('koreaCostsKrw'));
  const broker = intOrNull(form.get('brokerRub'));
  const inspection = intOrNull(form.get('inspectionCostKrw'));
  const free = intOrNull(form.get('freeInspections'));
  if (korea != null) await saveSetting('koreaCostsKrw', korea);
  if (broker != null) await saveSetting('brokerRub', broker);
  if (inspection != null) await saveSetting('inspectionCostKrw', inspection);
  if (free != null) await saveSetting('freeInspections', free);
  await saveSetting('depositKrw', intOrNull(form.get('depositKrw')));
  const manualRate = Number(String(form.get('rubKrwOverride') ?? '').replace(',', '.'));
  await saveSetting('rubKrwOverride', Number.isFinite(manualRate) && manualRate > 0 ? manualRate : null);
  // Пересчитать все цены при следующем проходе фонового процесса
  await query('update cars set price_calc_at = null where active');
  revalidatePath('/admin');
  redirect('/admin?saved=1');
}

export async function setSpecHp(form: FormData): Promise<void> {
  await guard();
  const key = String(form.get('key') ?? '');
  const hp = intOrNull(form.get('hp'));
  if (!key) return;
  if (hp) {
    await query(`update specs set hp = $2, hp_min = $2, hp_max = $2, status = 'manual', checked_at = now() where key = $1`, [key, hp]);
  } else {
    await query(`update specs set status = 'pending' where key = $1`, [key]);
  }
  await query('update cars set price_calc_at = null where spec_key = $1', [key]);
  revalidatePath('/admin');
}

export async function saveDomains(form: FormData): Promise<void> {
  await guard();
  const v = String(form.get('domains') ?? '').toLowerCase().split(/[\s,]+/).map((d) => d.replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean).join(', ');
  await query(
    `insert into settings (key, value, updated_at) values ('site_domains', $1::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(v)],
  );
  revalidatePath('/admin');
  redirect('/admin?saved=1');
}

export async function saveTelegram(form: FormData): Promise<void> {
  await guard();
  const set = async (key: string, v: string) => {
    await query(
      `insert into settings (key, value, updated_at) values ($1, $2::jsonb, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [key, JSON.stringify(v)],
    );
  };
  const token = String(form.get('token') ?? '').trim();
  if (token) await set('telegram_bot_token', token); // пустое поле — оставить прежний токен
  await set('telegram_bot_username', String(form.get('username') ?? '').trim().replace(/^@/, ''));
  await set('telegram_admin_chat_id', String(form.get('chatId') ?? '').trim());
  const { notifyAdmin } = await import('@/lib/telegram');
  const ok = await notifyAdmin('✅ PICARBOO: бот подключён, заявки будут приходить сюда.');
  revalidatePath('/admin');
  redirect(ok ? '/admin?tg=ok' : '/admin?tg=fail');
}

// chat_id последнего, кто написал боту, — чтобы не искать его вручную.
export async function detectChatId(): Promise<void> {
  await guard();
  const { getTelegramConfig } = await import('@/lib/telegram');
  const { token } = await getTelegramConfig();
  if (!token) redirect('/admin?tg=notoken');
  const r = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null) as
    { result?: { message?: { chat?: { id?: number } } }[] } | null;
  const id = r?.result?.reverse().find((u) => u.message?.chat?.id)?.message?.chat?.id;
  if (!id) redirect('/admin?tg=nochat');
  await query(
    `insert into settings (key, value, updated_at) values ('telegram_admin_chat_id', $1::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(String(id))],
  );
  revalidatePath('/admin');
  redirect('/admin?tg=chat');
}
