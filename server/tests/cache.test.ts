import { describe, it, expect, beforeEach } from 'vitest';
import { cacheService, cacheKeys } from '../src/lib/cache';

describe('CacheService', () => {
  beforeEach(async () => {
    await cacheService.flushAll();
  });

  it('stores and retrieves values correctly', async () => {
    const testData = { revenue: 50000, recovered: 12500 };
    await cacheService.set('test:metrics:1', testData, 60);

    const retrieved = await cacheService.get<typeof testData>('test:metrics:1');
    expect(retrieved).toEqual(testData);
  });

  it('returns null for non-existent keys', async () => {
    const result = await cacheService.get('nonexistent:key');
    expect(result).toBeNull();
  });

  it('deletes specific keys correctly', async () => {
    await cacheService.set('test:del:1', 'value1', 60);
    await cacheService.set('test:del:2', 'value2', 60);

    await cacheService.del('test:del:1');
    expect(await cacheService.get('test:del:1')).toBeNull();
    expect(await cacheService.get('test:del:2')).toBe('value2');
  });

  it('deletes keys matching a pattern', async () => {
    await cacheService.set('reclaim:metrics:summary:m1', { atRisk: 100 }, 60);
    await cacheService.set('reclaim:metrics:by-lane:m1', { payment: 50 }, 60);
    await cacheService.set('reclaim:policies:m1', { maxAttempts: 3 }, 60);

    await cacheService.delByPattern('reclaim:metrics:*');

    expect(await cacheService.get('reclaim:metrics:summary:m1')).toBeNull();
    expect(await cacheService.get('reclaim:metrics:by-lane:m1')).toBeNull();
    expect(await cacheService.get('reclaim:policies:m1')).toEqual({ maxAttempts: 3 });
  });

  it('getOrSet returns cached value without calling fetcher again', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount += 1;
      return { count: 42 };
    };

    const first = await cacheService.getOrSet('test:getOrSet', fetcher, 60);
    expect(first).toEqual({ count: 42 });
    expect(callCount).toBe(1);

    const second = await cacheService.getOrSet('test:getOrSet', fetcher, 60);
    expect(second).toEqual({ count: 42 });
    expect(callCount).toBe(1); // Fetcher should not be called again
  });

  it('invalidates metrics properly via helper', async () => {
    const merchantId = 'merchant_123';
    const summaryKey = cacheKeys.metricsSummary(merchantId);
    const laneKey = cacheKeys.metricsByLane(merchantId);

    await cacheService.set(summaryKey, { totalAtRisk: 1000 }, 60);
    await cacheService.set(laneKey, { payment: 10 }, 60);

    expect(await cacheService.get(summaryKey)).not.toBeNull();
    expect(await cacheService.get(laneKey)).not.toBeNull();

    await cacheService.invalidateMetrics(merchantId);

    expect(await cacheService.get(summaryKey)).toBeNull();
    expect(await cacheService.get(laneKey)).toBeNull();
  });
});
