// Курсы: оплата авто — Naver «송금 받을 때» (₩ за 1 ₽, банк Hana); таможня — курс ЦБ РФ.
import { query } from './db';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

export interface Rates {
  rubKrwRemit: number; // ₩ за 1 ₽ (по нему клиент платит за авто)
  eurRub: number;      // ЦБ: ₽ за 1 €
  usdRub: number;      // ЦБ: ₽ за 1 $
  krwRub: number;      // ЦБ: ₽ за 1 ₩ (для таможенной стоимости)
  fetchedAt: string;
}

// Парсит блок курсов из выдачи search.naver.com по запросу «러시아 루블 환율».
export function parseNaverRemitReceive(html: string): number | null {
  const m = html.match(/송금 받을\s?때<\/strong>\s*<span[^>]*>([\d.,]+)<\/span>/);
  if (!m?.[1]) return null;
  const v = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(v) && v > 0 ? v : null;
}

export async function fetchNaverRubKrw(): Promise<number> {
  const url = `https://search.naver.com/search.naver?query=${encodeURIComponent('러시아 루블 환율')}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Naver ${res.status}`);
  const v = parseNaverRemitReceive(await res.text());
  if (v == null) throw new Error('Naver: курс «송금 받을 때» не найден на странице');
  return v;
}

interface CbrJson { Valute: Record<string, { Nominal: number; Value: number }> }

export async function fetchCbr(): Promise<{ eurRub: number; usdRub: number; krwRub: number }> {
  const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`ЦБ ${res.status}`);
  const d = (await res.json()) as CbrJson;
  const get = (code: string): number => {
    const v = d.Valute[code];
    if (!v) throw new Error(`ЦБ: нет курса ${code}`);
    return v.Value / v.Nominal;
  };
  return { eurRub: get('EUR'), usdRub: get('USD'), krwRub: get('KRW') };
}

export async function refreshRates(): Promise<Rates> {
  const [naver, cbr] = await Promise.allSettled([fetchNaverRubKrw(), fetchCbr()]);
  if (naver.status === 'fulfilled') await saveRate('RUB_KRW_REMIT', naver.value, 'naver:hana:remit_receive');
  if (cbr.status === 'fulfilled') {
    await saveRate('EUR_RUB', cbr.value.eurRub, 'cbr');
    await saveRate('USD_RUB', cbr.value.usdRub, 'cbr');
    await saveRate('KRW_RUB', cbr.value.krwRub, 'cbr');
  }
  const errors = [naver, cbr].filter((r) => r.status === 'rejected').map((r) => String((r as PromiseRejectedResult).reason));
  if (errors.length) console.error('Курсы:', errors.join('; '));
  return loadRates();
}

async function saveRate(code: string, value: number, source: string): Promise<void> {
  await query(
    `insert into rates (code, value, source, fetched_at) values ($1, $2, $3, now())
     on conflict (code) do update set value = excluded.value, source = excluded.source, fetched_at = now()`,
    [code, value, source],
  );
}

export async function loadRates(): Promise<Rates> {
  const rows = await query<{ code: string; value: number; fetched_at: Date }>('select code, value, fetched_at from rates');
  const map = new Map(rows.map((r) => [r.code, r]));
  const override = await query<{ value: number | null }>("select value from settings where key = 'rub_krw_override'");
  const need = (code: string): number => {
    const r = map.get(code);
    if (!r) throw new Error(`Нет курса ${code}: запустите обновление курсов`);
    return Number(r.value);
  };
  const manual = override[0]?.value;
  return {
    rubKrwRemit: typeof manual === 'number' && manual > 0 ? manual : need('RUB_KRW_REMIT'),
    eurRub: need('EUR_RUB'),
    usdRub: need('USD_RUB'),
    krwRub: need('KRW_RUB'),
    fetchedAt: (map.get('RUB_KRW_REMIT')?.fetched_at ?? new Date()).toISOString(),
  };
}
