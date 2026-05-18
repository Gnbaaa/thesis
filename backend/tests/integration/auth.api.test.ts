jest.mock('../../src/modules/auth/auth.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as authService from '../../src/modules/auth/auth.service';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../../src/shared/errors';
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

  it('GET /api/v1/auth/me requires auth', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/register validates password policy', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'new@example.com',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockAuth.register).not.toHaveBeenCalled();
  });

  it('POST /api/v1/auth/register maps duplicate email', async () => {
    mockAuth.register.mockRejectedValue(
      new ConflictError('Энэ и-мэйл бүртгэлтэй байна', 'EMAIL_ALREADY_EXISTS'),
    );

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'taken@example.com',
      password: 'Secret123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('POST /api/v1/auth/forgot-password validates email', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockAuth.forgotPassword).not.toHaveBeenCalled();
  });

  it('POST /api/v1/auth/forgot-password returns ok for unknown email', async () => {
    mockAuth.forgotPassword.mockResolvedValue({ ok: true });

    const res = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'ghost@example.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /api/v1/auth/reset-password rejects invalid token', async () => {
    mockAuth.resetPassword.mockRejectedValue(
      new UnauthorizedError('Token хүчингүй эсвэл хугацаа дууссан байна', 'INVALID_RESET_TOKEN'),
    );

    const res = await request(app).post('/api/v1/auth/reset-password').send({
      token: 'a'.repeat(40),
      newPassword: 'Newpass1',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_RESET_TOKEN');
  });

  it('POST /api/v1/auth/reset-password validates new password', async () => {
    const res = await request(app).post('/api/v1/auth/reset-password').send({
      token: 'a'.repeat(40),
      newPassword: 'weak',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockAuth.resetPassword).not.toHaveBeenCalled();
  });
});
