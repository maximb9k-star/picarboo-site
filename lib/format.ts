const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

export function rub(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`;
}

export function krw(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} ₩`;
}

export function km(n: number): string {
  return `${n.toLocaleString('ru-RU')} км`;
}

export function yearMonth(ym: number): string {
  const y = Math.floor(ym / 100);
  const m = ym % 100;
  const name = MONTHS[m - 1];
  return name ? `${name[0]!.toUpperCase()}${name.slice(1)} ${y}` : String(y);
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function carTitle(c: { manufacturer: string; model: string; badge?: string | null }): string {
  return [c.manufacturer, c.model, c.badge].filter(Boolean).join(' ');
}
