jest.mock('../../src/modules/users/users.service');
jest.mock('../../src/modules/users/admin/admin.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as usersService from '../../src/modules/users/users.service';
import * as adminService from '../../src/modules/users/admin/admin.service';
import { ForbiddenError } from '../../src/shared/errors';
import { bearerToken } from '../helpers/bearerToken';

const mockUsers = jest.mocked(usersService);
const mockAdmin = jest.mocked(adminService);

describe('users API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/v1/users/me requires auth', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/users/me returns profile', async () => {
    mockUsers.getMe.mockResolvedValue({
      id: 'u-1',
      email: 'me@example.com',
      firstName: 'Me',
      lastName: 'User',
      phone: null,
      role: 'user',
      status: 'active',
      avatarUrl: null,
    });

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@example.com');
  });

  it('GET /api/v1/users/admin/users forbids non-admin', async () => {
    const res = await request(app)
      .get('/api/v1/users/admin/users')
      .set('Authorization', bearerToken({ role: 'user' }));

    expect(res.status).toBe(403);
  });

  it('GET /api/v1/users/admin/users lists users for admin', async () => {
    mockAdmin.listUsers.mockResolvedValue({ items: [], total: 0 });

    const res = await request(app)
      .get('/api/v1/users/admin/users?page=1&pageSize=20')
      .set('Authorization', bearerToken({ role: 'admin' }));

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  it('PATCH /api/v1/users/admin/users/:id/role validates body', async () => {
    const res = await request(app)
      .patch('/api/v1/users/admin/users/00000000-0000-4000-8000-000000000050/role')
      .set('Authorization', bearerToken({ role: 'admin' }))
      .send({ role: 'superuser' });

    expect(res.status).toBe(400);
  });

  it('PATCH /api/v1/users/admin/users/:id/role maps forbidden', async () => {
    mockAdmin.setUserRole.mockRejectedValue(
      new ForbiddenError('Өөрийнхөө эрхийг өөрчлөх боломжгүй.', 'ADMIN_CANNOT_MODIFY_SELF'),
    );

    const res = await request(app)
      .patch('/api/v1/users/admin/users/00000000-0000-4000-8000-000000000050/role')
      .set('Authorization', bearerToken({ role: 'admin', id: 'admin-1' }))
      .send({ role: 'user' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ADMIN_CANNOT_MODIFY_SELF');
  });
});
