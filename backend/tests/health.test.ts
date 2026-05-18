jest.mock('../src/infra/db/pool', () => ({
  getPool: jest.fn(() => ({
    query: jest.fn().mockResolvedValue({ rows: [] }),
  })),
  closePool: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { app } from '../src/server';

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks).toHaveProperty('redis');
    expect(res.body.checks.postgres).toBe('ok');
  });
});
