import { closeTestConnections } from './testCleanup';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';

/** CI .env may set a short placeholder; auth.jwt requires length >= 16. */
const TEST_JWT_SECRET = 'test-jwt-secret-at-least-16-chars';
const envJwtSecret = process.env.JWT_SECRET?.trim();
process.env.JWT_SECRET =
  envJwtSecret && envJwtSecret.length >= 16 ? envJwtSecret : TEST_JWT_SECRET;
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/pet_platform_test';

afterAll(async () => {
  await closeTestConnections();
});
