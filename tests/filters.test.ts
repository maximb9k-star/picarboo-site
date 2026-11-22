import { describe, it, expect } from 'vitest';
import { parseFilters, toQuery } from '@/lib/filters';
import { buildWhere } from '@/lib/catalog';

describe('фильтры каталога', () => {
  it('разбирает параметры и отбрасывает мусор', () => {
    const { filters, sort, page } = parseFilters({ brand: 'Kia', fuel: 'petrol,bogus,hybrid', price_max: '3 000 000', page: '-5', sort: 'hack', no_acc: '1' });
    expect(filters.manufacturer).toBe('Kia');
    expect(filters.fuel).toEqual(['petrol', 'hybrid']);
    expect(filters.priceMax).toBe(3_000_000);
    expect(filters.noAccidents).toBe(true);
    expect(sort).toBe('new');
    expect(page).toBe(1);
  });
  it('условия только через параметры запроса (без подстановки строк)', () => {
    const { sql, params } = buildWhere({ manufacturer: "Kia'; drop table cars;--", q: '50%_off' });
    expect(sql).not.toContain('drop table');
    expect(params[0]).toBe("Kia'; drop table cars;--");
    expect(params[1]).toBe('%50off%');
  });
  it('собирает ссылку с изменением', () => {
    expect(toQuery({ brand: 'Kia', page: '2' }, { page: undefined, sort: 'price_asc' })).toBe('?brand=Kia&sort=price_asc');
  });
});
