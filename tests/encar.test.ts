import { describe, it, expect } from 'vitest';
import { translateName, romanize, detectAwd, translateFuel } from '@/lib/encar/translate';
import { mapListItem, parseEncarDate, translatePart } from '@/lib/encar/map';
import { specKey, isTurboName, prettifyEn } from '@/worker/sync';

describe('перевод названий', () => {
  it.each([
    ['더 뉴 K5 3세대', 'The New K5 3-е поколение'],
    ['쏘나타 디 엣지 하이브리드(DN8)', 'Sonata The Edge Hybrid(DN8)'],
    ['밴 3인승 스마트', 'Van 3-местный Smart'],
    ['세부등급 없음', ''],
    ['아르테온', 'Arteon'],
    ['E-클래스 W213', 'E-Class W213'],
    ['가솔린 1.5 2WD', 'Бензин 1.5 2WD'],
  ])('%s → %s', (ko, ru) => expect(translateName(ko)).toBe(ru));

  it('неизвестный хангыль романизируется', () => {
    expect(romanize('한국')).toBe('Hanguk');
    expect(translateName('뭔가')).not.toMatch(/[가-힣]/);
  });
  it('полный привод и топливо', () => {
    expect(detectAwd('2.5T AWD 프레스티지')).toBe(true);
    expect(detectAwd('xDrive30d')).toBe(true);
    expect(detectAwd('2WD 모던')).toBe(false);
    expect(translateFuel('가솔린+전기')).toBe('hybrid');
    expect(translateFuel('LPG(일반인 구입)')).toBe('lpg');
  });
  it('названия деталей кузова', () => {
    expect(translatePart('프론트 휀더(좌)')).toBe('Переднее крыло (лев.)');
  });
  it('латиница из справочника Encar', () => {
    expect(prettifyEn('KORANDO')).toBe('Korando');
    expect(prettifyEn('GV80')).toBe('GV80');
  });
});

describe('объявление Encar', () => {
  const item = {
    Id: '41782458', Manufacturer: '기아', Model: '더 뉴 K5 3세대', Badge: '2.0 가솔린', BadgeDetail: '노블레스', FuelType: '가솔린',
    Year: 202306, FormYear: '2024', Mileage: 56065, Price: 2350, SellType: '일반', OfficeCityState: '경기',
    Photos: [{ type: '003', location: '/carpicture07/a_003.jpg', ordering: 3 }, { type: '001', location: '/carpicture07/a_001.jpg', ordering: 1 }],
    ModifiedDate: '2026-11-22 09:42:47.000 +09',
  };
  it('цена из 만원 в воны, фото по порядку', () => {
    const r = mapListItem(item)!;
    expect(r.price_krw).toBe(23_500_000);
    expect(r.photos).toEqual(['/carpicture07/a_001.jpg', '/carpicture07/a_003.jpg']);
    expect(r.manufacturer).toBe('Kia');
    expect(r.domestic).toBe(true);
    expect(r.modified_at).toBe('2026-11-22T09:42:47+09:00');
  });
  it('«цена по договорённости» пропускается', () => {
    expect(mapListItem({ ...item, Price: 9999 })).toBeNull();
  });
  it('дата Encar', () => {
    expect(parseEncarDate('bad')).toBeNull();
  });
  it('ключ комплектации для поиска мощности', () => {
    const k = specKey({ manufacturer_ko: '기아', model_ko: '더 뉴 K5 3세대', model_group_ko: 'K5', form_year: 2024, fuel: 'petrol', displacement: 1999, badge_ko: '1.6 터보', badge_detail_ko: null });
    expect(k).toBe('기아|K5|더 뉴 K5 3세대|2024|petrol|2000|T|');
    expect(isTurboName('2.0 가솔린')).toBeNull();
    expect(isTurboName('가솔린 2.5T 2WD')).toBe(true);
    expect(isTurboName('1.6 N라인')).toBe(true);
  });
});
