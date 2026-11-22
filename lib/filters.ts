// Разбор параметров адресной строки каталога в фильтры и обратно.
import type { CatalogFilters, SortKey } from './catalog';
import { SORTS } from './catalog';
import type { Fuel } from './encar/translate';

export type Params = Record<string, string | string[] | undefined>;

const FUELS: Fuel[] = ['petrol', 'diesel', 'lpg', 'hybrid', 'diesel_hybrid', 'electric', 'hydrogen'];

function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim().slice(0, 100) : undefined;
}

function int(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s.replace(/\s/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

function flag(v: string | string[] | undefined): boolean | undefined {
  return str(v) === '1' ? true : undefined;
}

export function parseFilters(p: Params): { filters: CatalogFilters; sort: SortKey; page: number } {
  const fuel = (str(p.fuel)?.split(',') ?? []).filter((x): x is Fuel => (FUELS as string[]).includes(x));
  const sortRaw = str(p.sort);
  const sort = (SORTS.find((s) => s.key === sortRaw)?.key ?? 'new') as SortKey;
  return {
    filters: {
      manufacturer: str(p.brand),
      modelGroup: str(p.model),
      model: str(p.gen),
      fuel: fuel.length ? fuel : undefined,
      priceMin: int(p.price_min),
      priceMax: int(p.price_max),
      yearMin: int(p.year_min),
      yearMax: int(p.year_max),
      mileageMin: int(p.km_min),
      mileageMax: int(p.km_max),
      ccMin: int(p.cc_min),
      ccMax: int(p.cc_max),
      hpMin: int(p.hp_min),
      hpMax: int(p.hp_max),
      awd: flag(p.awd),
      lowUtil: flag(p.low_util),
      passable: flag(p.passable),
      noAccidents: flag(p.no_acc),
      accidentsMax: int(p.acc_max),
      insuranceMaxKrw: int(p.ins_max),
      noDamage: flag(p.no_dmg),
      damageMax: int(p.dmg_max),
      color: str(p.color),
      body: str(p.body),
      q: str(p.q),
    },
    sort,
    page: Math.min(Math.max(int(p.page) ?? 1, 1), 1000),
  };
}

export function toQuery(p: Params, patch: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    const s = str(v);
    if (s) sp.set(k, s);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === '') sp.delete(k);
    else sp.set(k, v);
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}
