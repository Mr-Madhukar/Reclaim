import { redisConnection } from './redis';
import { logger } from './logger';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export const cacheKeys = {
  metricsSummary: (merchantId?: string) => `reclaim:metrics:summary:${merchantId || 'global'}`,
  metricsByLane: (merchantId?: string) => `reclaim:metrics:by-lane:${merchantId || 'global'}`,
  policies: (merchantId?: string) => `reclaim:policies:${merchantId || 'global'}`,
  caseDetail: (caseId: string) => `reclaim:case:${caseId}`,
};

export class CacheService {
  private memoryStore: Map<string, CacheEntry<unknown>> = new Map();
  private redisReady = false;

  constructor() {
    this.initRedisMonitoring();
  }

  private initRedisMonitoring(): void {
    if (redisConnection.status === 'ready') {
      this.redisReady = true;
    }

    redisConnection.on('ready', () => {
      this.redisReady = true;
      logger.info('[CacheService] Redis connection established & ready for caching');
    });

    redisConnection.on('close', () => {
      this.redisReady = false;
    });

    redisConnection.on('error', () => {
      this.redisReady = false;
    });
  }

  /**
   * Check if Redis is currently connected and responsive
   */
  public isRedisConnected(): boolean {
    return this.redisReady && redisConnection.status === 'ready';
  }

  /**
   * Retrieve a typed cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisConnected()) {
      try {
        const raw = await redisConnection.get(key);
        if (raw !== null) {
          return JSON.parse(raw) as T;
        }
        return null;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.debug({ key, err: msg }, '[CacheService] Redis get failed, falling back to memory');
      }
    }

    // Memory fallback
    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Store a value with a given TTL in seconds (default: 60s)
   */
  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryStore.set(key, { value, expiresAt });

    if (this.isRedisConnected()) {
      try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds > 0) {
          await redisConnection.setex(key, ttlSeconds, serialized);
        } else {
          await redisConnection.set(key, serialized);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.debug({ key, err: msg }, '[CacheService] Redis set failed');
      }
    }
  }

  /**
   * Delete one or multiple keys
   */
  async del(keys: string | string[]): Promise<void> {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const k of keyList) {
      this.memoryStore.delete(k);
    }

    if (this.isRedisConnected() && keyList.length > 0) {
      try {
        await redisConnection.del(...keyList);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.debug({ keys: keyList, err: msg }, '[CacheService] Redis del failed');
      }
    }
  }

  /**
   * Delete keys matching a pattern (e.g. "reclaim:metrics:*")
   */
  async delByPattern(pattern: string): Promise<void> {
    // Clean memory store using regex
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const k of this.memoryStore.keys()) {
      if (regexPattern.test(k)) {
        this.memoryStore.delete(k);
      }
    }

    if (this.isRedisConnected()) {
      try {
        const stream = redisConnection.scanStream({
          match: pattern,
          count: 100,
        });

        const keysToDelete: string[] = [];
        await new Promise<void>((resolve, reject) => {
          stream.on('data', (resultKeys: string[]) => {
            for (const rk of resultKeys) {
              keysToDelete.push(rk);
            }
          });
          stream.on('end', () => resolve());
          stream.on('error', (err) => reject(err));
        });

        if (keysToDelete.length > 0) {
          await redisConnection.del(...keysToDelete);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.debug({ pattern, err: msg }, '[CacheService] Redis scan/delete pattern failed');
      }
    }
  }

  /**
   * Read-through cache helper: returns cached value or executes fetcher and caches result
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 60): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  /**
   * Helper to invalidate metrics caches when case or policy states change
   */
  async invalidateMetrics(merchantId?: string): Promise<void> {
    const keys = [
      cacheKeys.metricsSummary(merchantId),
      cacheKeys.metricsByLane(merchantId),
      cacheKeys.metricsSummary(),
      cacheKeys.metricsByLane(),
    ];
    await this.del(keys);
    await this.delByPattern('reclaim:metrics:*');
  }

  /**
   * Helper to clear entire cache (useful in tests)
   */
  async flushAll(): Promise<void> {
    this.memoryStore.clear();
    if (this.isRedisConnected()) {
      try {
        await this.delByPattern('reclaim:*');
      } catch {
        // ignore
      }
    }
  }
}

export const cacheService = new CacheService();
