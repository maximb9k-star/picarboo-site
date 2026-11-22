// Избранное хранится в браузере посетителя (без регистрации).
const KEY = 'picarboo:favorites';

export function readFavorites(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is number => typeof x === 'number').slice(0, 200) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(id: number): boolean {
  const list = readFavorites();
  const has = list.includes(id);
  const next = has ? list.filter((x) => x !== id) : [id, ...list];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // приватный режим — просто не сохраняем
  }
  return !has;
}
