import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { calcCustoms, clearanceFee, ageGroup } from '@/lib/pricing/customs';
import { utilCoefficient, yearFactor } from '@/lib/pricing/util-table';

interface Case {
  age: '0-3' | '3-5' | '5-7' | '7-0';
  engine: number;
  cc: number;
  hp: number;
  valueRub: number;
  expected: { clearanceFee: number; duty: number; excise: number; vat: number; util: number };
}
const fixture = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'fixtures/calcus-2026-11.json'), 'utf8')) as { eurRub: number; cases: Case[] };
const AGE_MONTHS = { '0-3': 12, '3-5': 48, '5-7': 72, '7-0': 100 } as const;

// Граничные значения мощности, где calcus внутри переводит л.с. в кВт и округляет иначе.
const BOUNDARY_HP = new Set([310, 370, 130]);

describe('растаможка совпадает с calcus.ru', () => {
  const cases = fixture.cases.filter((c) => !BOUNDARY_HP.has(c.hp));
  it(`проверяем ${cases.length} расчётов`, () => {
    expect(cases.length).toBeGreaterThan(150);
  });
  for (const c of cases) {
    it(`${c.age} лет, двигатель ${c.engine}, ${c.cc} см³, ${c.hp} л.с.`, () => {
      const r = calcCustoms({
        valueRub: c.valueRub,
        eurRub: fixture.eurRub,
        ageMonths: AGE_MONTHS[c.age],
        displacementCc: c.cc,
        hp: c.hp,
        engine: c.engine === 4 || c.engine === 5 ? 'electric' : 'ice',
        year: 2026,
      });
      expect(r.clearanceFee).toBe(c.expected.clearanceFee);
      expect(Math.abs(r.duty - c.expected.duty)).toBeLessThanOrEqual(1);
      expect(Math.abs(r.excise - c.expected.excise)).toBeLessThanOrEqual(1);
      expect(Math.abs(r.vat - c.expected.vat)).toBeLessThanOrEqual(1);
      expect(r.util).toBe(c.expected.util);
    });
  }
});

describe('правила расчёта', () => {
  it('сбор за оформление по границам стоимости', () => {
    expect(clearanceFee(200_000)).toBe(1_231);
    expect(clearanceFee(200_001)).toBe(2_462);
    expect(clearanceFee(2_700_000)).toBe(13_541);
    expect(clearanceFee(12_000_000)).toBe(73_860);
  });

  it('возрастные группы', () => {
    expect(ageGroup(35)).toBe('lt3');
    expect(ageGroup(36)).toBe('3to5');
    expect(ageGroup(59)).toBe('3to5');
    expect(ageGroup(60)).toBe('5to7');
    expect(ageGroup(84)).toBe('gt7');
  });

  it('льготный утильсбор: до 3 л и до 160 л.с.', () => {
    expect(utilCoefficient({ ageMonths: 12, cc: 2999, hp: 160, engine: 'ice', year: 2026 })).toBe(0.17);
    expect(utilCoefficient({ ageMonths: 40, cc: 1600, hp: 150, engine: 'ice', year: 2029 })).toBe(0.26);
    expect(utilCoefficient({ ageMonths: 12, cc: 3001, hp: 150, engine: 'ice', year: 2026 })).toBe(129.2);
  });

  it('рост коэффициента по годам — как в графике calcus (+10% в год до 2030)', () => {
    // 1,0–2,0 л, 161–190 л.с., до 3 лет: 900 000 → 990 000 → 1 089 000 → 1 198 000 → 1 317 600 ₽
    const k = (year: number) => utilCoefficient({ ageMonths: 12, cc: 1500, hp: 175, engine: 'ice', year }) * 20_000;
    expect([2026, 2027, 2028, 2029, 2030].map(k)).toEqual([900_000, 990_000, 1_089_000, 1_198_000, 1_317_600]);
    expect(k(2031)).toBe(1_317_600);
    expect(yearFactor(2025, 45)).toBe(45);
  });

  it('без мощности утильсбор не считается и расчёт помечается', () => {
    const r = calcCustoms({ valueRub: 2_000_000, eurRub: 90, ageMonths: 48, displacementCc: 2000, hp: null, engine: 'ice', year: 2026 });
    expect(r.needsHp).toBe(true);
    expect(r.util).toBe(0);
  });
});
