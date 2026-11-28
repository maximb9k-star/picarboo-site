import { describe, expect, it } from 'vitest';
import { hybridMotorPeakHp, hybridCustomsHp, isMildHybridGrade } from '@/lib/pricing/hybrid';
import { rateLimit } from '@/lib/ratelimit';
import { issueCode, checkCode } from '@/lib/admin2fa';

describe('мощность гибридов', () => {
  it('Grandeur 2.4 HEV: 159 л.с. ДВС + 45% от 51 л.с. мотора = 182', () => {
    const m = hybridMotorPeakHp({ makerKo: '현대', cc: 2359, turbo: false, mild: false, naverMotorHp: 0 });
    expect(m).toEqual({ peak: 51, source: 'table' });
    expect(hybridCustomsHp(159, m.peak)).toBe(182);
  });
  it('данные Naver важнее таблицы', () => {
    expect(hybridMotorPeakHp({ makerKo: '현대', cc: 1598, turbo: true, mild: false, naverMotorHp: 64 })).toEqual({ peak: 64, source: 'naver' });
    expect(hybridMotorPeakHp({ makerKo: '기아', cc: 1600, turbo: false, mild: false, naverMotorHp: 0 })).toEqual({ peak: 60, source: 'table' });
    expect(hybridMotorPeakHp({ makerKo: '기아', cc: 1580, turbo: false, mild: false, naverMotorHp: 0 })).toEqual({ peak: 44, source: 'table' });
  });
  it('без данных — запас и проверка в админке', () => {
    expect(hybridMotorPeakHp({ makerKo: '렉서스', cc: 2487, turbo: false, mild: false, naverMotorHp: 0 })).toEqual({ peak: 80, source: 'default' });
    expect(hybridMotorPeakHp({ makerKo: '제네시스', cc: 3470, turbo: true, mild: true, naverMotorHp: 0 })).toEqual({ peak: 20, source: 'default' });
  });
  it('распознаёт мягкий гибрид по комплектации Naver', () => {
    expect(isMildHybridGrade('3.5 가솔린 터보 MHEV AWD')).toBe(true);
    expect(isMildHybridGrade('2.5 가솔린 터보')).toBe(false);
  });
});

describe('защита', () => {
  it('ограничивает число попыток', () => {
    for (let i = 0; i < 3; i++) expect(rateLimit('t:ip', 3, 60_000)).toBe(true);
    expect(rateLimit('t:ip', 3, 60_000)).toBe(false);
  });
  it('код 2FA одноразовый, неверный код не проходит', () => {
    const [n, code] = issueCode();
    expect(checkCode(n, code === '000000' ? '111111' : '000000')).toBe('wrong');
    expect(checkCode(n, code)).toBe('ok');
    expect(checkCode(n, code)).toBe('expired');
  });
});

describe('мягкие гибриды по модели', async () => {
  const { mildHybridRule } = await import('@/lib/pricing/mhev');
  const base = { cc: 1998, variant: null, fuel: 'petrol' };
  it('BMW 520i G60 — мягкий гибрид', () => {
    expect(mildHybridRule({ ...base, makerKo: 'BMW', modelKo: '5시리즈 (G60)', formYear: 2024, variant: '520i' })?.motorHp).toBe(11);
  });
  it('X5 G05: до рестайлинга — нет, после — да', () => {
    expect(mildHybridRule({ ...base, makerKo: 'BMW', modelKo: 'X5 (G05)', formYear: 2022, cc: 2998 })).toBeNull();
    expect(mildHybridRule({ ...base, makerKo: 'BMW', modelKo: 'X6 (G06)', formYear: 2024, cc: 2998 })?.motorHp).toBe(12);
  });
  it('520i G30 и подключаемые гибриды — нет', () => {
    expect(mildHybridRule({ ...base, makerKo: 'BMW', modelKo: '5시리즈 (G30)', formYear: 2022 })).toBeNull();
    expect(mildHybridRule({ ...base, makerKo: 'BMW', modelKo: '5시리즈 (G60)', formYear: 2024, fuel: 'hybrid' })).toBeNull();
  });
  it('Mercedes GLE до рестайлинга: 450 — да, 300d — нет', () => {
    expect(mildHybridRule({ ...base, makerKo: '벤츠', modelKo: 'GLE-클래스 W167', formYear: 2021, variant: 'GLE450', cc: 2999 })?.motorHp).toBe(22);
    expect(mildHybridRule({ ...base, makerKo: '벤츠', modelKo: 'GLE-클래스 W167', formYear: 2021, variant: 'GLE300d', fuel: 'diesel' })).toBeNull();
  });
});
