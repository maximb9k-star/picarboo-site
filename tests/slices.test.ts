import { describe, it, expect } from 'vitest';
import { splitSlice, sliceQuery } from '@/worker/sync';

describe('деление каталога на куски', () => {
  it('сначала по цене, затем по пробегу, без пересечений', () => {
    expect(splitSlice({ p: [0, 9], m: [0, 100] })).toEqual([{ p: [0, 4], m: [0, 100] }, { p: [5, 9], m: [0, 100] }]);
    expect(splitSlice({ p: [1500, 1500], m: [0, 101] })).toEqual([{ p: [1500, 1500], m: [0, 50] }, { p: [1500, 1500], m: [51, 101] }]);
    expect(splitSlice({ p: [7, 7], m: [3, 3] })).toBeNull();
  });
  it('запрос Encar с диапазонами', () => {
    expect(sliceQuery({ p: [1000, 1100], m: [0, 50000] })).toBe('(And.Hidden.N._.CarType.A._.SellType.일반._.Price.range(1000..1100)._.Mileage.range(0..50000).)');
  });
});
