import { describe, expect, it } from 'vitest';
import { ev30MinHp } from '@/lib/pricing/customs';

describe('ev30MinHp', () => {
  it('берёт 45% пиковой мощности, как таможня без данных испытаний', () => {
    expect(ev30MinHp(120)).toBe(54);
    expect(ev30MinHp(925)).toBe(416);
  });
});
