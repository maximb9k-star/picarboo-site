// Цена «под ключ до Владивостока»: авто + расходы по Корее и доставка + брокер + таможня.
import { calcCustoms, type AgeGroup, type CustomsResult } from './customs';
import type { Fuel } from '../encar/translate';

export interface PriceRates {
  rubKrwRemit: number; // ₩ за 1 ₽ (Naver, 송금 받을 때)
  eurRub: number;      // ЦБ
  krwRub: number;      // ЦБ, ₽ за 1 ₩
}

export interface PriceSettings {
  koreaCostsKrw: number;
  brokerRub: number;
}

export interface PriceInput {
  priceKrw: number;
  yearMonth: number;      // 202306
  displacementCc: number | null;
  hp: number | null;
  fuel: Fuel;
  now?: Date;
}

export interface PriceBreakdown {
  carRub: number;
  koreaCostsRub: number;
  brokerRub: number;
  customs: CustomsResult;
  customsValueRub: number;
  totalRub: number;
  ageMonths: number;
  ageGroup: AgeGroup;
  monthsToNextGroup: number | null; // через сколько месяцев сменится ставка пошлины
  rates: PriceRates;
}

export function ageInMonths(yearMonth: number, now: Date): number {
  const y = Math.floor(yearMonth / 100);
  const m = yearMonth % 100 || 1;
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
}

export function calcPrice(input: PriceInput, rates: PriceRates, settings: PriceSettings): PriceBreakdown | null {
  const now = input.now ?? new Date();
  const electric = input.fuel === 'electric' || input.fuel === 'hydrogen';
  if (!electric && !input.displacementCc) return null;
  const ageMonths = Math.max(0, ageInMonths(input.yearMonth, now));
  const customsValueRub = Math.round(input.priceKrw * rates.krwRub);
  const customs = calcCustoms({
    valueRub: customsValueRub,
    eurRub: rates.eurRub,
    ageMonths,
    displacementCc: electric ? 0 : input.displacementCc ?? 0,
    hp: input.hp,
    engine: electric ? 'electric' : 'ice',
    year: now.getFullYear(),
  });
  const carRub = Math.round(input.priceKrw / rates.rubKrwRemit);
  const koreaCostsRub = Math.round(settings.koreaCostsKrw / rates.rubKrwRemit);
  const totalRub = carRub + koreaCostsRub + settings.brokerRub + customs.total;
  const next = ageMonths < 36 ? 36 : ageMonths < 60 ? 60 : ageMonths < 84 ? 84 : null;
  return {
    carRub,
    koreaCostsRub,
    brokerRub: settings.brokerRub,
    customs,
    customsValueRub,
    totalRub,
    ageMonths,
    ageGroup: customs.ageGroup,
    monthsToNextGroup: next == null ? null : next - ageMonths,
    rates,
  };
}

// «Проходной» — 3–5 лет: пошлина по объёму, самая низкая для физлиц.
export function rateLabel(group: AgeGroup): 'passable' | 'high' {
  return group === '3to5' ? 'passable' : 'high';
}
