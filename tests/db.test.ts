// Интеграционные тесты с PostgreSQL. Нужна пустая база: TEST_DATABASE_URL=postgres://.../picarboo_test
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const url = process.env.TEST_DATABASE_URL;
const d = url ? describe : describe.skip;

d('база: каталог, цены, заявки', () => {
  let mod: {
    query: typeof import('@/lib/db').query;
    closePool: typeof import('@/lib/db').closePool;
    upsertList: typeof import('@/worker/sync').upsertList;
    repriceAll: typeof import('@/worker/sync').repriceAll;
    searchCars: typeof import('@/lib/catalog').searchCars;
    createLead: typeof import('@/lib/leads').createLead;
    saveSetting: typeof import('@/lib/settings').saveSetting;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    const db = await import('@/lib/db');
    await db.query('drop schema public cascade; create schema public;');
    const { migrate } = await import('@/scripts/migrate');
    await migrate();
    const sync = await import('@/worker/sync');
    const catalog = await import('@/lib/catalog');
    const leads = await import('@/lib/leads');
    const settings = await import('@/lib/settings');
    mod = { query: db.query, closePool: db.closePool, upsertList: sync.upsertList, repriceAll: sync.repriceAll, searchCars: catalog.searchCars, createLead: leads.createLead, saveSetting: settings.saveSetting };
    await db.query(`insert into rates (code, value, source) values ('RUB_KRW_REMIT', 15.84, 't'), ('EUR_RUB', 90.3445, 't'), ('USD_RUB', 82.19, 't'), ('KRW_RUB', 0.0617607, 't')`);
    const base = { domestic: true, manufacturer_ko: '기아', model_ko: 'K5', badge_ko: null, badge_detail_ko: null, manufacturer: 'Kia', model: 'K5', badge: null,
      fuel: 'petrol' as const, transmission: null, form_year: 2022, photo_path: null, photos: [], sell_type: '일반', city: null, awd: false, modified_at: '2026-11-20T10:00:00+09:00' };
    await mod.upsertList([
      { ...base, id: 1, year_month: 202206, mileage: 50000, price_krw: 20_000_000 },
      { ...base, id: 2, year_month: 202406, mileage: 10000, price_krw: 30_000_000, awd: true },
      { ...base, id: 3, year_month: 201806, mileage: 150000, price_krw: 8_000_000, manufacturer: 'Hyundai' },
    ]);
    await db.query(`insert into specs (key, hp, status) values ('k160', 160, 'ok'), ('k250', 250, 'ok')`);
    await db.query(`update cars set detail_fetched_at = now(), displacement = 1999, accident_cnt = 0, damaged_parts = 0, spec_key = 'k160' where id in (1, 3)`);
    await db.query(`update cars set detail_fetched_at = now(), displacement = 2497, accident_cnt = 2, damaged_parts = 1, spec_key = 'k250' where id = 2`);
  });

  afterAll(async () => { await mod?.closePool(); });

  it('пересчёт цен заполняет price_rub целыми рублями', async () => {
    const r = await mod.repriceAll(false);
    expect(r.priced).toBe(3);
    const rows = await mod.query<{ id: number; price_rub: number }>('select id, price_rub from cars order by id');
    for (const row of rows) expect(Number.isInteger(row.price_rub)).toBe(true);
    expect(rows[1]!.price_rub).toBeGreaterThan(rows[0]!.price_rub);
  });

  it('фильтры и сортировка', async () => {
    expect((await mod.searchCars({}, 'price_asc', 1)).cars.map((c) => c.id)).toEqual([3, 1, 2]);
    expect((await mod.searchCars({ manufacturer: 'Kia' }, 'new', 1)).total).toBe(2);
    expect((await mod.searchCars({ awd: true }, 'new', 1)).cars.map((c) => c.id)).toEqual([2]);
    expect((await mod.searchCars({ noAccidents: true, noDamage: true }, 'new', 1)).total).toBe(2);
    expect((await mod.searchCars({ lowUtil: true }, 'new', 1)).total).toBe(2);
    expect((await mod.searchCars({ passable: true }, 'new', 1)).cars.map((c) => c.id)).toEqual([1]);
    expect((await mod.searchCars({ yearMin: 2024 }, 'new', 1)).cars.map((c) => c.id)).toEqual([2]);
  });

  it('смена цены на Encar сбрасывает расчёт', async () => {
    const [before] = await mod.query<{ price_calc_at: Date | null }>('select price_calc_at from cars where id = 1');
    expect(before!.price_calc_at).not.toBeNull();
    const [row] = await mod.query<Record<string, unknown>>('select * from cars where id = 1');
    await mod.upsertList([{ ...(row as unknown as Parameters<typeof mod.upsertList>[0][number]), photos: [], price_krw: 19_000_000 }]);
    const [after] = await mod.query<{ price_calc_at: Date | null; price_krw: number }>('select price_calc_at, price_krw from cars where id = 1');
    expect(after!.price_calc_at).toBeNull();
    expect(after!.price_krw).toBe(19_000_000);
  });

  it('настройки меняют расчёт', async () => {
    const [a] = await mod.query<{ price_rub: number }>('select price_rub from cars where id = 3');
    await mod.saveSetting('brokerRub', 150_000);
    await mod.repriceAll(false);
    const [b] = await mod.query<{ price_rub: number }>('select price_rub from cars where id = 3');
    expect(b!.price_rub - a!.price_rub).toBe(50_000);
  });

  it('заявка сохраняется (без Telegram — не доставлена)', async () => {
    const r = await mod.createLead({ name: 'Иван', contact: '@ivan', method: 'telegram', carId: 2, comment: '', consent: true }, null, 'https://picarboo.ru');
    expect(r.delivered).toBe(false);
    const [lead] = await mod.query<{ contact: string; car_id: number }>('select contact, car_id from leads where id = $1', [r.id]);
    expect(lead).toEqual({ contact: '@ivan', car_id: 2 });
  });
});
