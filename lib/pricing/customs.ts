// Растаможка легкового авто физлицом для личного пользования (РФ).
// Методика и ставки — как в калькуляторе calcus.ru/rastamozhka-auto (ставки на 2026 год).
// Все суммы — целые рубли; евро-ставки переводятся по курсу ЦБ.
import { utilCoefficient, UTIL_BASE_RUB } from './util-table';

export type EngineKind = 'ice' | 'electric';

export interface CustomsInput {
  valueRub: number;      // таможенная стоимость авто, ₽ (по курсу ЦБ)
  eurRub: number;        // курс ЦБ ₽ за 1 €
  ageMonths: number;     // возраст авто в месяцах на дату расчёта
  displacementCc: number; // объём, см³ (для электро — 0)
  hp: number | null;     // мощность, л.с.; null — неизвестна
  engine: EngineKind;
  year: number;          // календарный год расчёта (ставки утильсбора растут по годам)
}

export interface CustomsResult {
  clearanceFee: number;  // сбор за таможенное оформление
  duty: number;          // единая таможенная ставка / пошлина
  dutyNote: string;
  excise: number;
  vat: number;
  util: number;          // утилизационный сбор (0, если мощность неизвестна)
  utilCoef: number | null;
  total: number;
  ageGroup: AgeGroup;
  needsHp: boolean;      // без мощности сумма утильсбора неточна
}

export type AgeGroup = 'lt3' | '3to5' | '5to7' | 'gt7';

export function ageGroup(ageMonths: number): AgeGroup {
  if (ageMonths < 36) return 'lt3';
  if (ageMonths < 60) return '3to5';
  if (ageMonths < 84) return '5to7';
  return 'gt7';
}

const CLEARANCE_FEE_TIERS: [number, number][] = [
  [200_000, 1_231], [450_000, 2_462], [1_200_000, 4_924], [2_700_000, 13_541],
  [4_200_000, 18_465], [5_500_000, 21_344], [10_000_000, 49_240], [Infinity, 73_860],
];

export function clearanceFee(valueRub: number): number {
  for (const [limit, fee] of CLEARANCE_FEE_TIERS) if (valueRub <= limit) return fee;
  return 73_860;
}

// До 3 лет: % от стоимости, но не менее € за см³. [граница стоимости в €, %, € за см³]
const DUTY_LT3: [number, number, number][] = [
  [8_500, 54, 2.5], [16_700, 48, 3.5], [42_300, 48, 5.5], [84_500, 48, 7.5], [169_000, 48, 15], [Infinity, 48, 20],
];
// Старше 3 лет: € за см³ по объёму. [верхняя граница объёма, 3–5 лет, старше 5 лет]
const DUTY_OLD: [number, number, number][] = [
  [1000, 1.5, 3], [1500, 1.7, 3.2], [1800, 2.5, 3.5], [2300, 2.7, 4.8], [3000, 3, 5], [Infinity, 3.6, 5.7],
];

// Акциз (только электромобили у физлиц): ₽ за 1 л.с. по ставке диапазона, 2026 год.
const EXCISE_TIERS: [number, number][] = [
  [90, 0], [150, 64], [200, 613], [300, 1004], [400, 1711], [500, 1771], [Infinity, 1829],
];
const VAT_RATE = 0.22;

function roundRub(x: number): number {
  return Math.round(x);
}

export function duty(input: Pick<CustomsInput, 'valueRub' | 'eurRub' | 'ageMonths' | 'displacementCc' | 'engine'>): { duty: number; note: string } {
  if (input.engine === 'electric') {
    return { duty: roundRub(input.valueRub * 0.15), note: '15% стоимости' };
  }
  const group = ageGroup(input.ageMonths);
  if (group === 'lt3') {
    const valueEur = input.valueRub / input.eurRub;
    const tier = DUTY_LT3.find(([limit]) => valueEur <= limit) ?? DUTY_LT3[DUTY_LT3.length - 1]!;
    const [, pct, perCc] = tier;
    const byPct = input.valueRub * (pct / 100);
    const byCc = input.displacementCc * perCc * input.eurRub;
    return byPct >= byCc
      ? { duty: roundRub(byPct), note: `${pct}% стоимости` }
      : { duty: roundRub(byCc), note: `${perCc} € за см³` };
  }
  const row = DUTY_OLD.find(([limit]) => input.displacementCc <= limit) ?? DUTY_OLD[DUTY_OLD.length - 1]!;
  const perCc = group === '3to5' ? row[1] : row[2];
  return { duty: roundRub(input.displacementCc * perCc * input.eurRub), note: `${perCc} € за см³` };
}

export function excise(hp: number): number {
  const tier = EXCISE_TIERS.find(([limit]) => hp <= limit) ?? EXCISE_TIERS[EXCISE_TIERS.length - 1]!;
  return roundRub(hp * tier[1]);
}

export function calcCustoms(input: CustomsInput): CustomsResult {
  const group = ageGroup(input.ageMonths);
  const fee = clearanceFee(input.valueRub);
  const d = duty(input);
  let exc = 0;
  let vat = 0;
  if (input.engine === 'electric') {
    exc = input.hp != null ? excise(input.hp) : 0;
    vat = roundRub((input.valueRub + d.duty + exc) * VAT_RATE);
  }
  const coef = input.hp != null
    ? utilCoefficient({ ageMonths: input.ageMonths, cc: input.displacementCc, hp: input.hp, engine: input.engine, year: input.year })
    : null;
  const util = coef != null ? roundRub(UTIL_BASE_RUB * coef) : 0;
  return {
    clearanceFee: fee,
    duty: d.duty,
    dutyNote: d.note,
    excise: exc,
    vat,
    util,
    utilCoef: coef,
    total: fee + d.duty + exc + vat + util,
    ageGroup: group,
    needsHp: coef == null,
  };
}
