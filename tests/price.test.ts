import { describe, it, expect } from 'vitest';
import { calcPrice, ageInMonths, rateLabel } from '@/lib/pricing/price';

const rates = { rubKrwRemit: 15.84, eurRub: 90.3445, krwRub: 0.0617607 };
const settings = { koreaCostsKrw: 2_000_000, brokerRub: 100_000 };
const now = new Date('2026-11-22T00:00:00Z');

describe('цена под ключ', () => {
  it('складывается из авто, Кореи, брокера и таможни; всё в целых рублях', () => {
    const p = calcPrice({ priceKrw: 20_000_000, yearMonth: 202206, displacementCc: 1999, hp: 160, fuel: 'petrol', now }, rates, settings)!;
    expect(p.carRub).toBe(Math.round(20_000_000 / 15.84));
    expect(p.koreaCostsRub).toBe(Math.round(2_000_000 / 15.84));
    expect(p.brokerRub).toBe(100_000);
    expect(p.customsValueRub).toBe(Math.round(20_000_000 * 0.0617607));
    expect(p.totalRub).toBe(p.carRub + p.koreaCostsRub + p.brokerRub + p.customs.total);
    for (const v of [p.carRub, p.koreaCostsRub, p.customs.total, p.totalRub]) expect(Number.isInteger(v)).toBe(true);
    expect(p.ageGroup).toBe('3to5');
    expect(p.customs.utilCoef).toBe(0.26);
    expect(rateLabel(p.ageGroup)).toBe('passable');
  });

  it('гибрид считается как бензиновый, электромобиль — по своим правилам', () => {
    const hybrid = calcPrice({ priceKrw: 30_000_000, yearMonth: 202503, displacementCc: 1598, hp: 180, fuel: 'hybrid', now }, rates, settings)!;
    expect(hybrid.customs.vat).toBe(0);
    expect(hybrid.customs.utilCoef).toBe(45);
    const ev = calcPrice({ priceKrw: 30_000_000, yearMonth: 202503, displacementCc: null, hp: 200, fuel: 'electric', now }, rates, settings)!;
    expect(ev.customs.dutyNote).toBe('15% стоимости');
    expect(ev.customs.vat).toBeGreaterThan(0);
  });

  it('без объёма двигателя у ДВС расчёт невозможен', () => {
    expect(calcPrice({ priceKrw: 10_000_000, yearMonth: 202001, displacementCc: null, hp: 150, fuel: 'diesel', now }, rates, settings)).toBeNull();
  });

  it('через сколько месяцев сменится ставка', () => {
    const p = calcPrice({ priceKrw: 10_000_000, yearMonth: 202403, displacementCc: 1600, hp: 120, fuel: 'petrol', now }, rates, settings)!;
    expect(p.ageMonths).toBe(32);
    expect(p.monthsToNextGroup).toBe(4);
    expect(ageInMonths(202611, now)).toBe(0);
  });
});
