// Утилизационный сбор для легковых авто, ввозимых физлицом для личного пользования.
// Коэффициенты на 2026 год сняты с калькулятора calcus.ru/rastamozhka-auto (22.11.2026).
// С 2027 по 2030 год коэффициент растёт на 10% в год: K(год) = round(K(2026) × 1,1^(год − 2026), 2).
export const UTIL_BASE_RUB = 20_000;
export const UTIL_TABLE_YEAR = 2026;

// Верхние границы диапазонов мощности, л.с. (включительно).
const ICE_HP = [160, 190, 220, 250, 280, 310, 340, 370, 400, 430, 460, 500, Infinity];
// Верхние границы объёма, см³ (включительно).
const ICE_CC = [1000, 2000, 3000, 3500, Infinity];

// [объём][мощность]. null — льготный коэффициент (до 3 л и до 160 л.с.).
const ICE_LT3: (number | null)[][] = [
  [null, 15.36, 15.84, 16.2, 17.28, 17.28, 17.28, 17.28, 17.28, 17.28, 17.28, 17.28, 17.28],
  [null, 45, 47.64, 50.52, 57.12, 64.56, 72.96, 83.16, 94.8, 108, 123.24, 140.4, 160.08],
  [null, 115.34, 118.2, 120.12, 126, 131.04, 136.32, 141.72, 147.48, 153.36, 159.48, 165.84, 172.44],
  [129.2, 131.76, 134.4, 137.16, 140.52, 144, 151.92, 160.32, 169.2, 178.44, 188.28, 198.6, 209.52],
  [164.53, 167.28, 170.16, 173.04, 176.52, 180, 186.36, 192.88, 199.68, 206.64, 213.84, 221.28, 229.08],
];
const ICE_GTE3: (number | null)[][] = [
  [null, 28.44, 29.28, 30.12, 30.12, 30.12, 30.12, 30.12, 30.12, 30.12, 30.12, 30.12, 30.12],
  [null, 74.64, 79.2, 83.88, 91.92, 100.56, 110.16, 120.6, 132, 144.6, 158.4, 173.4, 189.84],
  [null, 172.8, 175.08, 177.6, 183, 188.52, 193.68, 199.08, 204.72, 210.48, 216.36, 222.36, 228.6],
  [197.81, 200.04, 202.2, 204.36, 207.24, 212.4, 217.8, 224.28, 231, 237.96, 245.04, 252.48, 260.04],
  [216.29, 219.48, 222.84, 226.2, 231.36, 236.64, 249.6, 263.4, 277.92, 293.16, 309.36, 326.4, 344.28],
];

// Электромобили: по 30-минутной мощности. До 80 л.с. — льготный.
const EV_HP = [80, 100, 130, 160, 190, 220, 250, 280, Infinity];
const EV_LT3: (number | null)[] = [null, 49.56, 65.88, 78, 92.4, 109.68, 129.96, 153.96, 182.4];
const EV_GTE3: (number | null)[] = [null, 82.08, 95.64, 111.36, 129.72, 151.2, 176.16, 205.2, 239.04];

const PREFERENTIAL_LT3 = 0.17;
const PREFERENTIAL_GTE3 = 0.26;

function bracket(limits: number[], v: number): number {
  const i = limits.findIndex((l) => v <= l);
  return i < 0 ? limits.length - 1 : i;
}

export function yearFactor(year: number, base: number): number {
  const n = Math.min(Math.max(year, UTIL_TABLE_YEAR), 2030) - UTIL_TABLE_YEAR;
  return Math.round(base * 1.1 ** n * 100) / 100;
}

export function utilCoefficient(p: { ageMonths: number; cc: number; hp: number; engine: 'ice' | 'electric'; year: number }): number {
  const old = p.ageMonths >= 36;
  let base: number | null;
  if (p.engine === 'electric') {
    base = (old ? EV_GTE3 : EV_LT3)[bracket(EV_HP, p.hp)]!;
  } else {
    base = (old ? ICE_GTE3 : ICE_LT3)[bracket(ICE_CC, p.cc)]![bracket(ICE_HP, p.hp)]!;
  }
  if (base == null) return old ? PREFERENTIAL_GTE3 : PREFERENTIAL_LT3;
  return yearFactor(p.year, base);
}
