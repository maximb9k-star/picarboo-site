import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseGrades, matchGrade, cleanModelName, searchQueries, extractBalanced, extractVariant } from '@/lib/naver/spec';
import { parseNaverRemitReceive } from '@/lib/rates';

const fx = (f: string) => fs.readFileSync(path.join(import.meta.dirname, 'fixtures', f), 'utf8');

describe('мощность из Naver', () => {
  const grades = parseGrades(fx('naver-tivoli-2019.html'));
  it('разбирает комплектации', () => {
    expect(grades.map((g) => [g.name, g.cc, g.hp])).toEqual([
      ['1.5 가솔린 터보', 1497, 163], ['1.5 가솔린 터보 AWD', 1497, 163], ['1.6 디젤', 1597, 136], ['1.6 디젤 AWD', 1597, 136],
    ]);
    expect(grades[1]!.awd).toBe(true);
    expect(grades[0]!.turbo).toBe(true);
  });
  it('подбирает по объёму и топливу', () => {
    expect(matchGrade(grades, { cc: 1497, fuel: 'petrol', turbo: null })).toMatchObject({ hp: 163, status: 'ok' });
    expect(matchGrade(grades, { cc: 1597, fuel: 'diesel', turbo: null })).toMatchObject({ hp: 136 });
    expect(matchGrade(grades, { cc: 2000, fuel: 'petrol', turbo: null })).toBeNull();
    expect(matchGrade(grades, { cc: 1497, fuel: 'lpg', turbo: null })).toBeNull();
  });
  it('при разных мощностях берёт максимальную и помечает', () => {
    const r = matchGrade(
      [{ name: 'a', cc: 1999, fuel: '가솔린', hp: 150, turbo: false, awd: false }, { name: 'b', cc: 1998, fuel: '가솔린', hp: 245, turbo: true, awd: false }],
      { cc: 1999, fuel: 'petrol', turbo: null },
    );
    expect(r).toMatchObject({ hp: 150, status: 'ok' }); // без пометки «터보» — атмосферный
    const amb = matchGrade(
      [{ name: 'a', cc: 1998, fuel: '가솔린', hp: 184, turbo: true, awd: false }, { name: 'b', cc: 1998, fuel: '가솔린', hp: 252, turbo: true, awd: false }],
      { cc: 1998, fuel: 'petrol', turbo: null },
    );
    expect(amb).toMatchObject({ hp: 252, hpMin: 184, status: 'ambiguous' });
    const t = matchGrade(
      [{ name: 'a', cc: 1999, fuel: '가솔린', hp: 150, turbo: false, awd: false }, { name: 'b', cc: 1998, fuel: '가솔린', hp: 245, turbo: true, awd: false }],
      { cc: 1999, fuel: 'petrol', turbo: true },
    );
    expect(t).toMatchObject({ hp: 245, status: 'ok' });
  });
  it('версия из комплектации уточняет мощность', () => {
    expect(extractVariant('520i M 스포츠')).toBe('520i');
    expect(extractVariant('GLC300 4MATIC 아방가르드')).toBe('GLC300');
    expect(extractVariant('35 TDI 프리미엄')).toBe('35TDI');
    expect(extractVariant('2.0 가솔린 노블레스')).toBeNull();
    expect(extractVariant('xDrive30d M 스포츠')).toBe('30d');
    const g = [{ name: '520i', cc: 1998, fuel: '가솔린', hp: 184, turbo: true, awd: false }, { name: '530i', cc: 1998, fuel: '가솔린', hp: 252, turbo: true, awd: false }];
    expect(matchGrade(g, { cc: 1998, fuel: 'petrol', turbo: null, variant: '520i' })).toMatchObject({ hp: 184, status: 'ok' });
  });
  it('строит поисковые запросы', () => {
    expect(cleanModelName('더 뉴 K5 3세대')).toBe('K5');
    expect(cleanModelName('5시리즈 (G30)')).toBe('5시리즈');
    expect(searchQueries({ modelGroupKo: 'K5', modelKo: '더 뉴 K5 3세대', formYear: 2023 })[0]).toBe('2023 K5 제원');
  });
  it('вырезает JSON со скобками внутри строк', () => {
    expect(extractBalanced('x=[1,"a]b",[2]] tail', 2)).toBe('[1,"a]b",[2]]');
  });
});

describe('курс Naver', () => {
  it('берёт «송금 받을 때»', () => {
    expect(parseNaverRemitReceive(fx('naver-rub.html'))).toBe(15.84);
    expect(parseNaverRemitReceive('<html></html>')).toBeNull();
  });
});
