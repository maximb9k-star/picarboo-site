// Задачи синхронизации: каталог Encar, детали, мощности (Naver), цены.
import { query, getPool } from '../lib/db';
import { BASE_QUERY, fetchFacets, fetchList, fetchVehicle, fetchRecord, fetchInspection, NotFoundError, type EncarNode } from '../lib/encar/client';
import { mapListItem, mapDetail, CITIES, type CarListRow } from '../lib/encar/map';
import { translateName, translateManufacturer, fixEnglish } from '../lib/encar/translate';
import { resolveHp, extractVariant } from '../lib/naver/spec';
import { loadRates } from '../lib/rates';
import { loadSettings } from '../lib/settings';
import { calcPrice } from '../lib/pricing/price';
import type { Fuel } from '../lib/encar/translate';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function logJob<T>(job: string, fn: () => Promise<T>): Promise<T> {
  const [row] = await query<{ id: number }>('insert into sync_log (job) values ($1) returning id', [job]);
  try {
    const info = await fn();
    await query('update sync_log set finished_at = now(), ok = true, info = $2 where id = $1', [row!.id, JSON.stringify(info ?? null)]);
    return info;
  } catch (e) {
    await query('update sync_log set finished_at = now(), ok = false, info = $2 where id = $1', [row!.id, JSON.stringify({ error: String(e) })]);
    throw e;
  }
}

// ---------- Названия моделей ----------

export async function syncNames(): Promise<{ names: number }> {
  const top = await fetchFacets(BASE_QUERY);
  const makers = findFacets(top.iNav?.Nodes ?? [], 'Manufacturer');
  let n = 0;
  const queue = [...makers];
  async function worker(): Promise<void> {
    for (let m = queue.shift(); m; m = queue.shift()) {
      const en = m.Metadata?.EngName?.[0];
      if (en) { await saveName(m.Value, en, 'manufacturer'); n++; }
      if (!m.Count) continue;
      const q = `(And.Hidden.N._.SellType.일반._.(C.CarType.A._.Manufacturer.${escapeValue(m.Value)}.))`;
      try {
        const r = await fetchFacets(q);
        for (const g of findFacets(r.iNav?.Nodes ?? [], 'ModelGroup')) {
          const gen = g.Metadata?.EngName?.[0];
          if (gen) { await saveName(g.Value, prettifyEn(gen), 'model_group'); n++; }
        }
      } catch (e) {
        console.error('names', m.Value, String(e));
      }
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker));
  return { names: n };
}

// "KORANDO" → "Korando", но "GV80", "QM6", "EV3" не трогаем.
export function prettifyEn(s: string): string {
  return fixEnglish(s.replace(/_/g, ' ').split(' ').map((w) => (/^[A-Z]{5,}$/.test(w) ? w[0] + w.slice(1).toLowerCase() : w)).join(' ').trim());
}

function escapeValue(v: string): string {
  return v.replace(/\)/g, '_)');
}

function findFacets(nodes: EncarNode[], name: string): { Value: string; Count: number; Metadata?: { EngName?: string[] } }[] {
  const out: { Value: string; Count: number; Metadata?: { EngName?: string[] } }[] = [];
  for (const node of nodes) {
    const facets = node.Facets ?? [];
    if (node.Name === name) out.push(...facets);
    for (const f of facets) if (f.Refinements?.Nodes) out.push(...findFacets(f.Refinements.Nodes, name));
  }
  return out;
}

async function saveName(ko: string, en: string, kind: string): Promise<void> {
  await query(
    `insert into encar_names (ko, en, kind) values ($1, $2, $3)
     on conflict (ko) do update set en = excluded.en, kind = excluded.kind, updated_at = now()`,
    [ko, en, kind],
  );
}

export async function loadNames(): Promise<Record<string, string>> {
  const rows = await query<{ ko: string; en: string }>("select ko, en from encar_names where kind = 'model_group'");
  return Object.fromEntries(rows.map((r) => [r.ko, r.en]));
}

// Перевести заново все названия из сохранённых корейских полей (после правок словаря).
export async function retranslateAll(): Promise<{ updated: number }> {
  const names = await loadNames();
  let updated = 0;
  let lastId = 0;
  for (;;) {
    const rows = await query<{ id: number; manufacturer_ko: string; model_ko: string; badge_ko: string | null; badge_detail_ko: string | null; model_group_ko: string | null; city: string | null }>(
      'select id, manufacturer_ko, model_ko, badge_ko, badge_detail_ko, model_group_ko, city from cars where id > $1 order by id limit 5000', [lastId],
    );
    if (!rows.length) break;
    lastId = rows[rows.length - 1]!.id;
    const ids: number[] = [], makers: string[] = [], models: string[] = [], badges: (string | null)[] = [], groups: (string | null)[] = [], cities: (string | null)[] = [];
    for (const r of rows) {
      const badge = [r.badge_ko, r.badge_detail_ko].filter(Boolean).join(' ');
      ids.push(r.id);
      makers.push(translateManufacturer(r.manufacturer_ko));
      models.push(translateName(r.model_ko, names));
      badges.push(badge ? translateName(badge, names) || null : null);
      groups.push(r.model_group_ko ? fixEnglish(names[r.model_group_ko] ?? translateName(r.model_group_ko, names)) : null);
      cities.push(r.city ? CITIES[r.city] ?? r.city : null);
    }
    await query(
      `update cars c set manufacturer = v.m, model = v.mo, badge = v.b, model_group = coalesce(v.g, c.model_group), city = v.c
       from unnest($1::bigint[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[]) as v(id, m, mo, b, g, c) where c.id = v.id`,
      [ids, makers, models, badges, groups, cities],
    );
    updated += rows.length;
  }
  return { updated };
}

// ---------- Список ----------

const LIST_COLUMNS = [
  'id', 'domestic', 'manufacturer_ko', 'model_ko', 'badge_ko', 'badge_detail_ko', 'manufacturer', 'model', 'badge', 'fuel',
  'transmission', 'year_month', 'form_year', 'mileage', 'price_krw', 'photo_path', 'photos', 'sell_type', 'city', 'awd', 'modified_at',
] as const;

export async function upsertList(rows: CarListRow[]): Promise<void> {
  if (!rows.length) return;
  const values: unknown[] = [];
  const tuples = rows.map((r, i) => {
    const base = i * LIST_COLUMNS.length;
    for (const c of LIST_COLUMNS) values.push(c === 'photos' ? JSON.stringify(r.photos) : r[c]);
    return `(${LIST_COLUMNS.map((_, j) => `$${base + j + 1}`).join(',')})`;
  });
  // Если изменилась цена — сбрасываем расчёт, чтобы пересчитать.
  await query(
    `insert into cars (${LIST_COLUMNS.join(',')}) values ${tuples.join(',')}
     on conflict (id) do update set
       manufacturer = excluded.manufacturer, model = excluded.model, badge = excluded.badge,
       mileage = excluded.mileage, photo_path = excluded.photo_path,
       photos = case when cars.detail_fetched_at is null then excluded.photos else cars.photos end,
       city = excluded.city, modified_at = coalesce(excluded.modified_at, cars.modified_at),
       price_calc_at = case when cars.price_krw <> excluded.price_krw then null else cars.price_calc_at end,
       price_krw = excluded.price_krw,
       last_seen_at = now(), active = true`,
    values,
  );
}

// Encar сортирует нестабильно (у тысяч объявлений одинаковое время изменения), поэтому постраничный
// обход теряет и дублирует машины. Полный проход делит каталог по цене, затем по пробегу, пока каждый
// кусок не поместится в один запрос (до 500 шт.) — так каждая машина видна ровно один раз.
const SLICE_LIMIT = 500;

interface Slice { p: [number, number]; m: [number, number] }

export function sliceQuery(s: Slice): string {
  return `(And.Hidden.N._.CarType.A._.SellType.일반._.Price.range(${s.p[0]}..${s.p[1]})._.Mileage.range(${s.m[0]}..${s.m[1]}).)`;
}

export function splitSlice(s: Slice): Slice[] | null {
  if (s.p[0] < s.p[1]) {
    const mid = Math.floor((s.p[0] + s.p[1]) / 2);
    return [{ p: [s.p[0], mid], m: s.m }, { p: [mid + 1, s.p[1]], m: s.m }];
  }
  if (s.m[0] < s.m[1]) {
    const mid = Math.floor((s.m[0] + s.m[1]) / 2);
    return [{ p: s.p, m: [s.m[0], mid] }, { p: s.p, m: [mid + 1, s.m[1]] }];
  }
  return null;
}

interface FullScanState { queue: Slice[]; started: string; total: number; seen: number; failed: number; requests: number }

export async function getState<T>(key: string): Promise<T | null> {
  const [r] = await query<{ value: T }>('select value from sync_state where key = $1', [key]);
  return r?.value ?? null;
}

export async function setState(key: string, value: unknown): Promise<void> {
  await query(
    `insert into sync_state (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

// Один шаг полного прохода (до deadline). Состояние хранится в базе, следующий запуск продолжает с того же места.
// Возвращает done=true, когда проход закончен.
export async function syncFullStep(deadline: number, concurrency = 4): Promise<{ done: boolean; seen: number; total: number; queue: number; deactivated?: number }> {
  let st = await getState<FullScanState>('full_scan');
  if (!st) {
    const total = (await fetchList(BASE_QUERY, 0, 1)).Count;
    st = { queue: [{ p: [0, 999_999], m: [0, 9_999_999] }], started: new Date().toISOString(), total, seen: 0, failed: 0, requests: 0 };
  }
  const names = await loadNames();
  const state = st;
  let active = 0;
  async function worker(): Promise<void> {
    while (Date.now() < deadline) {
      const s = state.queue.shift();
      if (!s) {
        if (active === 0) return;
        await sleep(100);
        continue;
      }
      active++;
      try {
        const r = await fetchList(sliceQuery(s), 0, SLICE_LIMIT);
        state.requests++;
        const parts = r.Count > r.SearchResults.length ? splitSlice(s) : null;
        if (parts) {
          state.queue.push(...parts);
        } else {
          state.seen += r.SearchResults.length;
          const rows = r.SearchResults.map((it) => mapListItem(it, names)).filter((x): x is CarListRow => x != null);
          await upsertList([...new Map(rows.map((x) => [x.id, x])).values()]);
        }
      } catch (e) {
        state.queue.push(s); // повторим в следующий раз
        state.failed++;
        console.error('slice', JSON.stringify(s), String(e));
        if (state.failed > 50) break;
      } finally {
        active--;
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  if (state.queue.length > 0 && state.failed <= 50) {
    await setState('full_scan', state);
    return { done: false, seen: state.seen, total: state.total, queue: state.queue.length };
  }
  // Снятые с продажи скрываем, только если обошли почти весь каталог.
  let deactivated = 0;
  if (state.queue.length === 0 && state.seen >= state.total * 0.97) {
    const res = await getPool().query('update cars set active = false where active and last_seen_at < $1', [state.started]);
    deactivated = res.rowCount ?? 0;
  }
  await query("delete from sync_state where key = 'full_scan'");
  await setState('full_scan_last', { finished: new Date().toISOString(), seen: state.seen, total: state.total, deactivated, requests: state.requests });
  return { done: true, seen: state.seen, total: state.total, queue: 0, deactivated };
}

// Новые и изменённые объявления: первые страницы по дате изменения, пока не пойдут уже известные.
export async function syncList(): Promise<{ seen: number; total: number }> {
  const names = await loadNames();
  const pageSize = 200;
  let seen = 0;
  let total = 0;
  let unchangedPages = 0;
  for (let offset = 0; offset < 20_000; offset += pageSize) {
    const r = await fetchList(BASE_QUERY, offset, pageSize);
    total = r.Count;
    if (!r.SearchResults.length) break;
    const rows = r.SearchResults.map((it) => mapListItem(it, names)).filter((x): x is CarListRow => x != null);
    if (rows.length) {
      // id на странице могут повторяться (нестабильная сортировка Encar) — сравниваем уникальные.
      // Дат в выдаче нет: страница «не изменилась», если все машины уже есть в базе с той же ценой.
      const unique = [...new Map(rows.map((x) => [x.id, x])).values()];
      const known = await query<{ n: number }>(
        'select count(*)::int as n from cars c join unnest($1::bigint[], $2::bigint[]) as v(id, p) on c.id = v.id where c.price_krw = v.p and c.active',
        [unique.map((x) => x.id), unique.map((x) => x.price_krw)],
      );
      unchangedPages = (known[0]?.n ?? 0) >= unique.length ? unchangedPages + 1 : 0;
    }
    await upsertList([...new Map(rows.map((x) => [x.id, x])).values()]);
    seen += r.SearchResults.length;
    if (unchangedPages >= 2) break;
    await sleep(300);
  }
  return { seen, total };
}

// ---------- Детали ----------

export async function syncDetails(deadline: number, concurrency = 4): Promise<{ done: number; gone: number }> {
  const names = await loadNames();
  const cars = await query<{ id: number }>(
    'select id from cars where active and detail_fetched_at is null order by first_seen_at desc, id desc limit 400',
  );
  let done = 0;
  let gone = 0;
  const queue = [...cars];
  async function worker(): Promise<void> {
    for (let c = queue.shift(); c && Date.now() < deadline; c = queue.shift()) {
      try {
        await fetchAndSaveDetail(c.id, names);
        done++;
      } catch (e) {
        if (e instanceof NotFoundError) {
          await query('update cars set active = false where id = $1', [c.id]);
          gone++;
        } else {
          console.error('detail', c.id, String(e));
          await sleep(1000);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { done, gone };
}

// Из деталей сохраняем только то, что нужно для фильтров и расчёта; остальное страница авто берёт с Encar вживую.
export async function fetchAndSaveDetail(id: number, names?: Record<string, string>): Promise<void> {
  const v = await fetchVehicle(id);
  const [rec, ins] = await Promise.all([
    v.vehicleNo ? fetchRecord(v.vehicleId, v.vehicleNo) : Promise.resolve(null),
    fetchInspection(v.vehicleId),
  ]);
  const d = mapDetail(v, rec, ins, names ?? (await loadNames()));
  const [car] = await query<{ manufacturer_ko: string; model_ko: string; form_year: number | null; fuel: Fuel; badge_ko: string | null; badge_detail_ko: string | null }>(
    'select manufacturer_ko, model_ko, form_year, fuel, badge_ko, badge_detail_ko from cars where id = $1', [id],
  );
  if (!car) return;
  const key = specKey({ ...car, model_group_ko: d.model_group_ko, displacement: d.displacement });
  await query('insert into specs (key) values ($1) on conflict (key) do nothing', [key]);
  await query(
    `update cars set vehicle_id = $2, model_group_ko = $3, model_group = $4, displacement = $5, color = $6, body = $7,
       seats = $8, awd = awd or $9, accident_cnt = $10, insurance_krw = $11, owner_changes = $12, damaged_parts = $13,
       detail_fetched_at = now(), spec_key = $14, price_calc_at = null,
       transmission = coalesce($15, transmission), modified_at = coalesce($16::timestamptz, modified_at)
     where id = $1`,
    [id, d.vehicle_id, d.model_group_ko, d.model_group, d.displacement, d.color, d.body, d.seats, d.awd, d.accident_cnt,
      d.insurance_krw, d.owner_changes, d.damaged_parts, key, d.transmission, d.listed_at],
  );
}

export function isTurboName(...names: (string | null | undefined)[]): boolean | null {
  const s = names.filter(Boolean).join(' ');
  if (/터보|turbo|T-GDi|TGDi|TSI|TFSI|N\s?라인|N Line|\d\.\dT\b/i.test(s)) return true;
  return null;
}

export function specKey(c: { manufacturer_ko: string; model_ko: string; model_group_ko: string | null; form_year: number | null; fuel: string; displacement: number | null; badge_ko: string | null; badge_detail_ko: string | null }): string {
  const turbo = isTurboName(c.badge_ko, c.badge_detail_ko) ? 'T' : '';
  const cc = c.fuel === 'electric' || c.fuel === 'hydrogen' ? 0 : Math.round((c.displacement ?? 0) / 10) * 10;
  const variant = extractVariant([c.badge_ko, c.badge_detail_ko].filter(Boolean).join(' ')) ?? '';
  return [c.manufacturer_ko, c.model_group_ko ?? '', c.model_ko, c.form_year ?? '', c.fuel, cc, turbo, variant].join('|');
}

// ---------- Мощность (Naver) ----------

export async function syncSpecs(deadline: number): Promise<{ resolved: number; failed: number }> {
  const specs = await query<{ key: string }>(
    `select s.key from specs s join cars c on c.spec_key = s.key and c.active
     where s.status = 'pending' group by s.key order by count(*) desc limit 30`,
  );
  let resolved = 0;
  let failed = 0;
  for (const s of specs) {
    if (Date.now() > deadline - 8000) break; // один поиск на Naver — до нескольких запросов
    const [makerKo, groupKo, modelKo, formYear, fuel, cc, turbo, variant] = s.key.split('|');
    try {
      const r = await resolveHp({
        modelGroupKo: groupKo || null,
        modelKo: modelKo ?? '',
        formYear: formYear ? Number(formYear) : null,
        cc: cc ? Number(cc) : null,
        fuel: fuel ?? '',
        turbo: turbo === 'T' ? true : null,
        variant: variant || null,
        makerKo: makerKo || null,
      });
      // Для электромобилей таможня берёт 30-минутную мощность, а у Naver — пиковая: помечаем на проверку.
      const status = r ? (fuel === 'electric' || fuel === 'hydrogen' ? 'ambiguous' : r.status) : 'not_found';
      await query(
        `update specs set hp = $2, hp_min = $3, hp_max = $4, status = $5, naver_grade = $6, naver_model = $7, checked_at = now()
         where key = $1 and status <> 'manual'`,
        [s.key, r?.hp ?? null, r?.hpMin ?? null, r?.hpMax ?? null, status, r?.grade ?? null, r?.query ?? null],
      );
      await query('update cars set price_calc_at = null where spec_key = $1', [s.key]);
      if (r) resolved++; else failed++;
    } catch (e) {
      console.error('spec', s.key, String(e));
      break;
    }
    await sleep(500);
  }
  return { resolved, failed };
}

// ---------- Цены ----------

export async function repriceAll(onlyStale: boolean, deadline = Infinity): Promise<{ priced: number }> {
  const rates = await loadRates();
  const settings = await loadSettings();
  const now = new Date();
  let priced = 0;
  let lastId = 0;
  while (Date.now() < deadline) {
    const rows = await query<{ id: number; price_krw: number; year_month: number; displacement: number | null; fuel: Fuel; hp: number | null }>(
      `select c.id, c.price_krw, c.year_month, c.displacement, c.fuel, coalesce(c.hp_manual, s.hp) as hp
       from cars c left join specs s on s.key = c.spec_key
       where c.active and c.detail_fetched_at is not null and c.id > $1 ${onlyStale ? 'and c.price_calc_at is null' : ''}
       order by c.id limit 3000`,
      [lastId],
    );
    if (!rows.length) break;
    lastId = rows[rows.length - 1]!.id;
    const ids: number[] = [];
    const prices: (number | null)[] = [];
    const groups: (string | null)[] = [];
    const months: (number | null)[] = [];
    for (const r of rows) {
      const p = calcPrice(
        { priceKrw: r.price_krw, yearMonth: r.year_month, displacementCc: r.displacement, hp: r.hp, fuel: r.fuel, now },
        rates,
        settings,
      );
      ids.push(r.id);
      // Без мощности утильсбор неизвестен — итог не показываем, чтобы не занизить цену.
      prices.push(p && !p.customs.needsHp ? p.totalRub : null);
      groups.push(p?.ageGroup ?? null);
      months.push(p?.monthsToNextGroup ?? null);
    }
    await query(
      `update cars c set price_rub = v.price, age_group = v.g, months_to_next = v.m, price_calc_at = now()
       from unnest($1::bigint[], $2::bigint[], $3::text[], $4::int[]) as v(id, price, g, m) where c.id = v.id`,
      [ids, prices, groups, months],
    );
    priced += rows.length;
  }
  return { priced };
}
