// Адрес сайта и разрешённые домены. Домен можно сменить в админке, без доступа к серверу.
import { headers } from 'next/headers';
import { query } from './db';

export async function siteDomains(): Promise<string[]> {
  const list = new Set<string>();
  if (process.env.DOMAIN) list.add(process.env.DOMAIN.toLowerCase());
  try {
    const [r] = await query<{ v: string | null }>("select value #>> '{}' as v from settings where key = 'site_domains'");
    for (const d of (r?.v ?? '').split(/[\s,]+/)) if (d) list.add(d.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''));
  } catch {
    // база недоступна
  }
  return [...list];
}

// Основной адрес: первый домен из админки, иначе SITE_URL, иначе адрес текущего запроса.
export async function siteUrl(): Promise<string> {
  const domains = await siteDomains();
  const fromAdmin = domains.find((d) => d !== process.env.DOMAIN?.toLowerCase());
  if (fromAdmin) return `https://${fromAdmin}`;
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) return `${h.get('x-forwarded-proto') ?? 'https'}://${host}`;
  } catch {
    // вне запроса
  }
  return 'https://picarboo.ru';
}
