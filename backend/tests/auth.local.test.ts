import request from 'supertest';
import { app } from '../src/server';

describe('local auth endpoints', () => {
  it('GET /api/v1/auth/me returns 401 when missing token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error.code', 'UNAUTHORIZED');
  });

  it('POST /api/v1/auth/register validates password policy', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'a@b.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login requires password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'a@b.com',
      password: '',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/refresh validates refreshToken', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'x',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });
});

