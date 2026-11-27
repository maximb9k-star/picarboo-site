// Короткий кэш в памяти процесса сайта: одинаковые запросы к базе за TTL выполняются один раз,
// а одновременные запросы ждут один общий ответ. Позволяет держать в разы больше посетителей.
// Фоновый процесс (worker) этот кэш не использует, поэтому его данные появляются на сайте не позже чем через TTL.

export const PUBLIC_TTL_MS = 60_000;
const MAX_ENTRIES = 2000;

interface Entry { at: number; value: Promise<unknown> }

const g = globalThis as unknown as { __memo?: Map<string, Entry> };
const store = (g.__memo ??= new Map());

export function memo<T>(key: string, fn: () => Promise<T>, ttlMs = PUBLIC_TTL_MS): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && now - hit.at < ttlMs) return hit.value as Promise<T>;
  const value = fn();
  store.set(key, { at: now, value });
  value.catch(() => { if (store.get(key)?.value === value) store.delete(key); }); // ошибки не кэшируем
  if (store.size > MAX_ENTRIES) {
    for (const [k, e] of store) if (now - e.at >= ttlMs) store.delete(k);
    while (store.size > MAX_ENTRIES) store.delete(store.keys().next().value as string);
  }
  return value;
}

// Сбросить кэш (после сохранения настроек в админке).
export function clearMemo(): void {
  store.clear();
}
