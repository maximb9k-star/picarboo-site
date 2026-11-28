// Запросы каталога: фильтры, сортировка, карточка авто.
import { query } from './db';
import { memo } from './memo';
import type { Fuel } from './encar/translate';

export const PAGE_SIZE = 24;

export interface CatalogFilters {
  manufacturer?: string;
  modelGroup?: string;
  model?: string;
  fuel?: Fuel[];
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  ccMin?: number;
  ccMax?: number;
  hpMin?: number;
  hpMax?: number;
  awd?: boolean;
  lowUtil?: boolean;        // льготный утильсбор: до 160 л.с. и до 3 л
  passable?: boolean;       // «проходные» 3–5 лет
  noAccidents?: boolean;
  accidentsMax?: number;
  insuranceMaxKrw?: number;
  noDamage?: boolean;
  damageMax?: number;
  color?: string;
  body?: string;
  q?: string;
}

export type SortKey = 'new' | 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'mileage_asc' | 'mileage_desc';

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'new', label: 'Сначала новые объявления' },
  { key: 'price_asc', label: 'Сначала дешевле' },
  { key: 'price_desc', label: 'Сначала дороже' },
  { key: 'year_desc', label: 'Год: новее' },
  { key: 'year_asc', label: 'Год: старше' },
  { key: 'mileage_asc', label: 'Пробег: меньше' },
  { key: 'mileage_desc', label: 'Пробег: больше' },
];

const ORDER: Record<SortKey, string> = {
  new: '(c.price_rub is null), coalesce(c.modified_at, c.first_seen_at) desc, c.id desc',
  price_asc: 'c.price_rub asc nulls last, c.id',
  price_desc: 'c.price_rub desc nulls last, c.id',
  year_desc: 'c.year_month desc, c.id',
  year_asc: 'c.year_month asc, c.id',
  mileage_asc: 'c.mileage asc, c.id',
  mileage_desc: 'c.mileage desc, c.id',
};

export interface CarCard {
  id: number;
  manufacturer: string;
  model: string;
  badge: string | null;
  fuel: Fuel;
  year_month: number;
  mileage: number;
  displacement: number | null;
  hp: number | null;
  awd: boolean;
  price_krw: number;
  price_rub: number | null;
  photo_path: string | null;
  age_group: string | null;
  months_to_next: number | null;
  accident_cnt: number | null;
  first_seen_at: Date;
}

const HP_EXPR = 'coalesce(c.hp_manual, s.hp)';

export function buildWhere(f: CatalogFilters): { sql: string; params: unknown[] } {
  const where: string[] = ['c.active', 'c.detail_fetched_at is not null', 'not c.is_dup'];
  const params: unknown[] = [];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
  if (f.manufacturer) where.push(`c.manufacturer = ${p(f.manufacturer)}`);
  if (f.modelGroup) where.push(`c.model_group = ${p(f.modelGroup)}`);
  if (f.model) where.push(`c.model = ${p(f.model)}`);
  if (f.fuel?.length) where.push(`c.fuel = any(${p(f.fuel)}::text[])`);
  if (f.priceMin != null) where.push(`c.price_rub >= ${p(f.priceMin)}`);
  if (f.priceMax != null) where.push(`c.price_rub <= ${p(f.priceMax)}`);
  if (f.yearMin != null) where.push(`c.year_month >= ${p(f.yearMin * 100)}`);
  if (f.yearMax != null) where.push(`c.year_month <= ${p(f.yearMax * 100 + 12)}`);
  if (f.mileageMin != null) where.push(`c.mileage >= ${p(f.mileageMin)}`);
  if (f.mileageMax != null) where.push(`c.mileage <= ${p(f.mileageMax)}`);
  if (f.ccMin != null) where.push(`c.displacement >= ${p(f.ccMin)}`);
  if (f.ccMax != null) where.push(`c.displacement <= ${p(f.ccMax)}`);
  if (f.hpMin != null) where.push(`${HP_EXPR} >= ${p(f.hpMin)}`);
  if (f.hpMax != null) where.push(`${HP_EXPR} <= ${p(f.hpMax)}`);
  if (f.awd) where.push('c.awd');
  if (f.lowUtil) where.push(`${HP_EXPR} <= 160 and c.displacement <= 3000 and c.fuel not in ('electric','hydrogen')`);
  if (f.passable) where.push(`c.age_group = '3to5'`);
  if (f.noAccidents) where.push('c.accident_cnt = 0');
  else if (f.accidentsMax != null) where.push(`c.accident_cnt <= ${p(f.accidentsMax)}`);
  if (f.insuranceMaxKrw != null) where.push(`c.insurance_krw <= ${p(f.insuranceMaxKrw)}`);
  if (f.noDamage) where.push('c.damaged_parts = 0');
  else if (f.damageMax != null) where.push(`c.damaged_parts <= ${p(f.damageMax)}`);
  if (f.color) where.push(`c.color = ${p(f.color)}`);
  if (f.body) where.push(`c.body = ${p(f.body)}`);
  if (f.q) {
    const like = `%${f.q.replace(/[%_]/g, '')}%`;
    where.push(`(c.manufacturer || ' ' || c.model || ' ' || coalesce(c.badge, '')) ilike ${p(like)}`);
  }
  return { sql: where.join(' and '), params };
}

const CARD_COLUMNS = `c.id, c.manufacturer, c.model, c.badge, c.fuel, c.year_month, c.mileage, c.displacement, ${HP_EXPR} as hp, c.awd,
  c.price_krw, c.price_rub, c.photo_path, c.age_group, c.months_to_next, c.accident_cnt, c.first_seen_at`;

async function searchCarsDb(f: CatalogFilters, sort: SortKey, page: number): Promise<{ cars: CarCard[]; total: number }> {
  const { sql, params } = buildWhere(f);
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE;
  const [cars, count] = await Promise.all([
    query<CarCard>(
      `select ${CARD_COLUMNS} from cars c left join specs s on s.key = c.spec_key
       where ${sql} order by ${ORDER[sort]} limit ${PAGE_SIZE} offset ${offset}`,
      params,
    ),
    query<{ n: number }>(`select count(*)::int as n from cars c left join specs s on s.key = c.spec_key where ${sql}`, params),
  ]);
  return { cars, total: count[0]?.n ?? 0 };
}

export interface FacetOption { value: string; count: number }

async function facetManufacturersDb(): Promise<FacetOption[]> {
  return query<FacetOption>(
    `select manufacturer as value, count(*)::int as count from cars where active and detail_fetched_at is not null and not is_dup
     group by 1 order by count(*) desc`,
  );
}

async function facetModelGroupsDb(manufacturer: string): Promise<FacetOption[]> {
  return query<FacetOption>(
    `select model_group as value, count(*)::int as count from cars
     where active and detail_fetched_at is not null and not is_dup and manufacturer = $1 and model_group is not null group by 1 order by 1`,
    [manufacturer],
  );
}

async function facetModelsDb(manufacturer: string, modelGroup: string): Promise<FacetOption[]> {
  return query<FacetOption>(
    `select model as value, count(*)::int as count from cars
     where active and detail_fetched_at is not null and not is_dup and manufacturer = $1 and model_group = $2 group by 1 order by count(*) desc`,
    [manufacturer, modelGroup],
  );
}

async function facetSimpleDb(column: 'color' | 'body'): Promise<FacetOption[]> {
  return query<FacetOption>(
    `select ${column} as value, count(*)::int as count from cars where active and detail_fetched_at is not null and not is_dup and ${column} is not null
     group by 1 order by count(*) desc`,
  );
}

export interface CarFull extends CarCard {
  model_group: string | null;
  transmission: string | null;
  form_year: number | null;
  color: string | null;
  body: string | null;
  seats: number | null;
  vin: string | null;
  vehicle_no: string | null;
  vehicle_id: number | null;
  photos: string[];
  insurance_krw: number | null;
  damaged_parts: number | null;
  owner_changes: number | null;
  spec_status: string | null;
  spec_hp_peak: number | null; // пиковая мощность по Naver (для электромобилей)
  spec_grade: string | null;   // комплектация по Naver, например «3.5 가솔린 터보 MHEV AWD»
  spec_ice_hp: number | null;   // гибрид: мощность ДВС
  spec_motor_hp: number | null; // гибрид: пиковая мощность электромотора
  city: string | null;
  modified_at: Date | null;
  active: boolean;
}

async function getCarDb(id: number): Promise<CarFull | null> {
  const rows = await query<CarFull>(
    `select ${CARD_COLUMNS}, c.model_group, c.transmission, c.form_year, c.color, c.body, c.seats, c.vin, c.vehicle_no, c.vehicle_id, c.photos,
       c.insurance_krw, c.damaged_parts, c.owner_changes, s.status as spec_status, s.hp_max as spec_hp_peak, s.naver_grade as spec_grade, s.ice_hp as spec_ice_hp, s.motor_hp as spec_motor_hp, c.city, c.modified_at, c.active
     from cars c left join specs s on s.key = c.spec_key where c.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

async function catalogStatsDb(): Promise<{ total: number; today: number }> {
  const [r] = await query<{ total: number; today: number }>(
    `select count(*)::int as total, count(*) filter (where first_seen_at > now() - interval '24 hours')::int as today
     from cars where active and detail_fetched_at is not null and not is_dup`,
  );
  return r ?? { total: 0, today: 0 };
}

async function latestCarsDb(limit = 8): Promise<CarCard[]> {
  return query<CarCard>(
    `select ${CARD_COLUMNS} from cars c left join specs s on s.key = c.spec_key
     where c.active and c.price_rub is not null and not c.is_dup order by coalesce(c.modified_at, c.first_seen_at) desc limit $1`,
    [limit],
  );
}

// Публичные функции — с кэшем на 1 минуту (см. lib/memo.ts).
export const searchCars = (f: CatalogFilters, sort: SortKey, page: number) =>
  memo(`search:${JSON.stringify([f, sort, page])}`, () => searchCarsDb(f, sort, page));
export const facetManufacturers = () => memo('facet:manufacturer', facetManufacturersDb);
export const facetModelGroups = (manufacturer: string) =>
  memo(`facet:group:${manufacturer}`, () => facetModelGroupsDb(manufacturer));
export const facetModels = (manufacturer: string, modelGroup: string) =>
  memo(`facet:model:${manufacturer}\u0000${modelGroup}`, () => facetModelsDb(manufacturer, modelGroup));
export const facetSimple = (column: 'color' | 'body') => memo(`facet:${column}`, () => facetSimpleDb(column));
export const getCar = (id: number) => memo(`car:${id}`, () => getCarDb(id));
export const catalogStats = () => memo('stats', catalogStatsDb);
export const latestCars = (limit = 8) => memo(`latest:${limit}`, () => latestCarsDb(limit));
