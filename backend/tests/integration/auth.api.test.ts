jest.mock('../../src/modules/auth/auth.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as authService from '../../src/modules/auth/auth.service';
import { ForbiddenError, UnauthorizedError } from '../../src/shared/errors';
import { bearerToken } from '../helpers/bearerToken';
import { mockAuthUser } from '../helpers/mockUser';

const mockAuth = jest.mocked(authService);

describe('auth API (service-mocked)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/v1/auth/me returns JWT user payload', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', bearerToken({ email: 'me@example.com' }));

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });

  it('POST /api/v1/auth/login returns tokens from service', async () => {
    const user = mockAuthUser();
    mockAuth.login.mockResolvedValue({
      user,
      accessToken: 'access-test',
      refreshToken: 'refresh-test',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Secret123',
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe('access-test');
  });

  it('POST /api/v1/auth/login maps invalid credentials', async () => {
    mockAuth.login.mockRejectedValue(
      new UnauthorizedError('И-мэйл эсвэл нууц үг буруу байна', 'INVALID_CREDENTIALS'),
    );

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'Wrongpass1',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/v1/auth/refresh maps suspended user', async () => {
    mockAuth.refresh.mockRejectedValue(
      new ForbiddenError('Таны бүртгэл түр түдгэлзсэн байна.', 'USER_SUSPENDED'),
    );

    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'some-refresh-token-value-here',
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('USER_SUSPENDED');
  });
});
