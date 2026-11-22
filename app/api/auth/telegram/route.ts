import { NextResponse } from 'next/server';
import { checkTelegramAuth, sign, COOKIE_NAMES } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const next = url.searchParams.get('next') || '/';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const data: Record<string, string> = {};
  for (const k of ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash']) {
    const v = url.searchParams.get(k);
    if (v != null) data[k] = v;
  }
  if (!token || !checkTelegramAuth(data, token)) {
    return NextResponse.redirect(new URL(`${safeNext}${safeNext.includes('?') ? '&' : '?'}login=failed`, url));
  }
  const [user] = await query<{ id: number }>(
    `insert into users (telegram_id, username, first_name, last_name, photo_url) values ($1, $2, $3, $4, $5)
     on conflict (telegram_id) do update set username = excluded.username, first_name = excluded.first_name,
       last_name = excluded.last_name, photo_url = excluded.photo_url, last_login_at = now()
     returning id`,
    [Number(data.id), data.username ?? null, data.first_name ?? null, data.last_name ?? null, data.photo_url ?? null],
  );
  const res = NextResponse.redirect(new URL(safeNext, url));
  const exp = Math.floor(Date.now() / 1000) + 90 * 86400;
  res.cookies.set(COOKIE_NAMES.user, sign({ uid: user!.id, tg: Number(data.id), name: data.first_name ?? data.username ?? '', exp }), {
    httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:', path: '/', maxAge: 90 * 86400,
  });
  return res;
}
