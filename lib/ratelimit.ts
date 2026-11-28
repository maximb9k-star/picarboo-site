// Ограничение частоты в памяти процесса сайта: защита от перебора пароля и спама.
import { headers } from 'next/headers';

const g = globalThis as unknown as { __rl?: Map<string, number[]> };
const store: Map<string, number[]> = (g.__rl ??= new Map<string, number[]>());

// true — можно продолжать; false — лимит исчерпан. count=false только проверяет, не засчитывая попытку.
export function rateLimit(key: string, limit: number, windowMs: number, count = true): boolean {
  const now = Date.now();
  const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    store.set(key, recent);
    return false;
  }
  if (count) recent.push(now);
  store.set(key, recent);
  if (store.size > 10_000) for (const [k, v] of store) if (!v.some((t) => now - t < 3_600_000)) store.delete(k);
  return true;
}

export function resetLimit(key: string): void {
  store.delete(key);
}

// IP посетителя: Caddy ставит X-Forwarded-For с адресом клиента.
export function ipFrom(h: Headers): string {
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
}

export async function clientIp(): Promise<string> {
  return ipFrom(await headers());
}
