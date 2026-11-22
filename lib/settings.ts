import { query } from './db';

export interface Settings {
  koreaCostsKrw: number;
  brokerRub: number;
  depositKrw: number | null;
  inspectionCostKrw: number;
  freeInspections: number;
  rubKrwOverride: number | null;
  phone: string;
  telegramUsername: string;
  whatsapp: string;
}

export const DEFAULT_SETTINGS: Settings = {
  koreaCostsKrw: 2_000_000,
  brokerRub: 100_000,
  depositKrw: null,
  inspectionCostKrw: 150_000,
  freeInspections: 5,
  rubKrwOverride: null,
  phone: '+821023435838',
  telegramUsername: 'maximbyak',
  whatsapp: '821023435838',
};

const KEYS: Record<keyof Settings, string> = {
  koreaCostsKrw: 'korea_costs_krw',
  brokerRub: 'broker_rub',
  depositKrw: 'deposit_krw',
  inspectionCostKrw: 'inspection_cost_krw',
  freeInspections: 'free_inspections',
  rubKrwOverride: 'rub_krw_override',
  phone: 'phone',
  telegramUsername: 'telegram_username',
  whatsapp: 'whatsapp',
};

export async function loadSettings(): Promise<Settings> {
  const rows = await query<{ key: string; value: unknown }>('select key, value from settings');
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const s = { ...DEFAULT_SETTINGS } as Record<keyof Settings, unknown>;
  for (const [field, key] of Object.entries(KEYS) as [keyof Settings, string][]) {
    if (map.has(key)) s[field] = map.get(key);
  }
  return s as unknown as Settings;
}

export async function saveSetting<K extends keyof Settings>(field: K, value: Settings[K]): Promise<void> {
  await query(
    `insert into settings (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [KEYS[field], JSON.stringify(value)],
  );
}
