import { closeTestConnections } from './testCleanup';

export default async function globalTeardown(): Promise<void> {
  await closeTestConnections();
}
