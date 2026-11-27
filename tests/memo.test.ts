import { describe, expect, it, vi } from 'vitest';
import { memo, clearMemo } from '@/lib/memo';

describe('memo', () => {
  it('кэширует результат и объединяет одновременные запросы', async () => {
    clearMemo();
    const fn = vi.fn(async () => 42);
    const [a, b] = await Promise.all([memo('k', fn), memo('k', fn)]);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(await memo('k', fn)).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('перезапрашивает после истечения TTL', async () => {
    clearMemo();
    vi.useFakeTimers();
    try {
      const fn = vi.fn(async () => 1);
      await memo('t', fn, 1000);
      vi.advanceTimersByTime(1001);
      await memo('t', fn, 1000);
      expect(fn).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('не кэширует ошибки', async () => {
    clearMemo();
    const fn = vi.fn().mockRejectedValueOnce(new Error('db')).mockResolvedValueOnce('ok');
    await expect(memo('e', fn)).rejects.toThrow('db');
    expect(await memo('e', fn)).toBe('ok');
  });

  it('clearMemo сбрасывает кэш', async () => {
    clearMemo();
    const fn = vi.fn(async () => 'x');
    await memo('c', fn);
    clearMemo();
    await memo('c', fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
