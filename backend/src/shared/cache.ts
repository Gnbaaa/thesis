import { ensureRedisConnected, isRedisConfigured } from '../infra/redis/client';
import { logger } from './logger';

/** NFR-P2: popular list filters — default 60s TTL */
export const LIST_CACHE_TTL_SEC = Math.max(
  1,
  Number(process.env.CACHE_LIST_TTL_SEC ?? 60) || 60,
);

const CACHE_PREFIX = 'petplatform:';

type CacheEntry = {
  value: string;
  expiresAt: number | null;
};

const memory = new Map<string, CacheEntry>();

function fullKey(key: string): string {
  return key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`;
}

function memoryGet(key: string): string | null {
  const entry = memory.get(fullKey(key));
  if (!entry) return null;
  if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
    memory.delete(fullKey(key));
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds?: number): void {
  const expiresAt =
    typeof ttlSeconds === 'number' && ttlSeconds > 0
      ? Date.now() + ttlSeconds * 1000
      : null;
  memory.set(fullKey(key), { value, expiresAt });
}

function memoryDel(key: string): void {
  memory.delete(fullKey(key));
}

function memoryDelByPrefix(prefix: string): void {
  const needle = fullKey(prefix);
  for (const key of memory.keys()) {
    if (key.startsWith(needle)) memory.delete(key);
  }
}

export async function get<T>(key: string): Promise<T | null> {
  const redis = await ensureRedisConnected();
  if (redis) {
    try {
      const raw = await redis.get(fullKey(key));
      if (raw !== null) return JSON.parse(raw) as T;
    } catch (err) {
      logger.warn({ err, key }, 'cache.redis_get_failed');
    }
  }

  const raw = memoryGet(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    memoryDel(key);
    return null;
  }
}

export async function set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const raw = JSON.stringify(value);
  memorySet(key, raw, ttlSeconds);

  const redis = await ensureRedisConnected();
  if (!redis) return;

  try {
    const k = fullKey(key);
    if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
      await redis.setex(k, ttlSeconds, raw);
    } else {
      await redis.set(k, raw);
    }
  } catch (err) {
    logger.warn({ err, key }, 'cache.redis_set_failed');
  }
}

export async function del(key: string): Promise<void> {
  memoryDel(key);
  const redis = await ensureRedisConnected();
  if (!redis) return;
  try {
    await redis.del(fullKey(key));
  } catch (err) {
    logger.warn({ err, key }, 'cache.redis_del_failed');
  }
}

export async function delByPrefix(prefix: string): Promise<void> {
  memoryDelByPrefix(prefix);

  const redis = await ensureRedisConnected();
  if (!redis) return;

  const pattern = `${fullKey(prefix)}*`;
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch (err) {
    logger.warn({ err, prefix }, 'cache.redis_del_by_prefix_failed');
  }
}

export async function wrap<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null) return cached;
  const value = await fn();
  await set(key, value, ttlSeconds);
  return value;
}

/** Stable cache key for paginated list queries (species, status, location filters). */
export function buildListCacheKey(prefix: string, query: Record<string, unknown>): string {
  const normalized: Record<string, unknown> = {};
  for (const key of Object.keys(query).sort()) {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      normalized[key] = value;
    }
  }
  return `${prefix}${JSON.stringify(normalized)}`;
}

export function logCacheBackendOnce(): void {
  if (process.env.NODE_ENV === 'test') return;
  if (isRedisConfigured()) {
    logger.info('cache.backend redis_with_memory_fallback');
  } else {
    logger.warn('cache.backend memory_only (set REDIS_URL for shared cache)');
  }
}
