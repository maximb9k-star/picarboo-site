// Подписанные cookie: сессия покупателя (вход через Telegram) и администратора.
import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const USER_COOKIE = 'pb_user';
const ADMIN_COOKIE = 'pb_admin';

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET не задан (нужно минимум 16 символов)');
  return s;
}

export function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verify<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString()) as T & { exp?: number };
    if (data.exp && data.exp < Date.now() / 1000) return null;
    return data;
  } catch {
    return null;
  }
}

export interface UserSession { uid: number; tg: number; name: string; exp: number }

export async function getUser(): Promise<UserSession | null> {
  if (!process.env.SESSION_SECRET) return null;
  return verify<UserSession>((await cookies()).get(USER_COOKIE)?.value);
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.SESSION_SECRET || !process.env.ADMIN_PASSWORD) return false;
  return verify<{ admin: true }>((await cookies()).get(ADMIN_COOKIE)?.value)?.admin === true;
}

export const COOKIE_NAMES = { user: USER_COOKIE, admin: ADMIN_COOKIE };

// Проверка данных виджета Telegram Login: https://core.telegram.org/widgets/login#checking-authorization
export function checkTelegramAuth(data: Record<string, string>, botToken: string, maxAgeSec = 86400): boolean {
  const { hash, ...rest } = data;
  if (!hash) return false;
  const check = Object.keys(rest).sort().map((k) => `${k}=${rest[k]}`).join('\n');
  const key = crypto.createHash('sha256').update(botToken).digest();
  const mac = crypto.createHmac('sha256', key).update(check).digest('hex');
  if (mac.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(hash))) return false;
  const authDate = Number(rest.auth_date);
  return Number.isFinite(authDate) && Date.now() / 1000 - authDate < maxAgeSec;
}

export function loginConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME && process.env.SESSION_SECRET);
}
