import { closePool } from '../src/infra/db/pool';
import { closeRedis } from '../src/infra/redis/client';
import { disconnectMongo } from '../src/infra/mongo/connection';

/** Close shared clients after tests so Jest exits cleanly. */
export async function closeTestConnections(): Promise<void> {
  await Promise.allSettled([closePool(), closeRedis(), disconnectMongo()]);
}
