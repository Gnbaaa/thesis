import request from 'supertest';
import { app } from '../src/server';

describe('GET /api/v1/auth/google', () => {
  it('redirects to Google when configured, otherwise 503', async () => {
    const res = await request(app).get('/api/v1/auth/google');
    if (res.status === 503) {
      expect(res.body).toHaveProperty('message');
      return;
    }
    expect([302, 303, 307]).toContain(res.status);
    expect(res.headers.location).toMatch(/accounts\.google\.com|google\.com/);
  });
});
