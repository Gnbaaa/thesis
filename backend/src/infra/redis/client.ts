import Redis from 'ioredis';
import { logger } from '../../shared/logger';

let client: Redis | null = null;
let connectAttempted = false;

export function isRedisConfigured(): boolean {
  if (process.env.NODE_ENV === 'test') return false;
  return Boolean(process.env.REDIS_URL?.trim());
}

export function getRedis(): Redis | null {
  if (!isRedisConfigured()) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
    client.on('error', (err) => {
      logger.warn({ err }, 'redis.client_error');
    });
  }
  return client;
}

export async function ensureRedisConnected(): Promise<Redis | null> {
  const redis = getRedis();
  if (!redis) return null;
  if (redis.status === 'ready') return redis;
  if (connectAttempted && redis.status === 'end') return null;
  try {
    connectAttempted = true;
    await redis.connect();
    return redis;
  } catch (err) {
    logger.warn({ err }, 'redis.connect_failed');
    return null;
  }
}

export async function pingRedis(): Promise<boolean> {
  const redis = await ensureRedisConnected();
  if (!redis) return false;
  try {
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    client.disconnect();
  } finally {
    client = null;
    connectAttempted = false;
  }
}
