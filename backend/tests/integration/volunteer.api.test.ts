jest.mock('../../src/modules/volunteer/volunteer.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as volunteerService from '../../src/modules/volunteer/volunteer.service';
import { ConflictError, NotFoundError } from '../../src/shared/errors';
import { bearerToken } from '../helpers/bearerToken';

const mockVolunteer = jest.mocked(volunteerService);

describe('volunteer API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/v1/volunteer lists posts', async () => {
    mockVolunteer.listVolunteerPosts.mockResolvedValue({ items: [], total: 0 });

    const res = await request(app).get('/api/v1/volunteer');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  it('POST /api/v1/volunteer/:id/register requires auth', async () => {
    const res = await request(app).post(
      '/api/v1/volunteer/00000000-0000-4000-8000-000000000040/register',
    );
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/volunteer/:id/register registers user', async () => {
    mockVolunteer.registerForVolunteerPost.mockResolvedValue({
      id: 'vp-1',
      isRegisteredByViewer: true,
    } as never);

    const res = await request(app)
      .post('/api/v1/volunteer/00000000-0000-4000-8000-000000000040/register')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(201);
    expect(res.body.isRegisteredByViewer).toBe(true);
  });

  it('POST /api/v1/volunteer creates post for NGO', async () => {
    mockVolunteer.createVolunteerPost.mockResolvedValue({ id: 'vp-new' } as never);

    const res = await request(app)
      .post('/api/v1/volunteer')
      .set('Authorization', bearerToken({ role: 'ngo' }))
      .send({
        title: 'Walk dogs',
        description: 'Help at shelter on Saturday morning.',
        location: 'Ulaanbaatar',
        eventDate: '2026-06-15',
        requiredCount: 5,
        status: 'active',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('vp-new');
  });

  it('GET /api/v1/volunteer/:id rejects invalid uuid', async () => {
    const res = await request(app).get('/api/v1/volunteer/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/volunteer/:id returns 404 when missing', async () => {
    mockVolunteer.getVolunteerPostById.mockRejectedValue(
      new NotFoundError('Сайн дурын зар олдсонгүй', 'VOLUNTEER_POST_NOT_FOUND'),
    );

    const res = await request(app).get(
      '/api/v1/volunteer/00000000-0000-4000-8000-000000000040',
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('VOLUNTEER_POST_NOT_FOUND');
  });

  it('POST /api/v1/volunteer forbids regular users', async () => {
    const res = await request(app)
      .post('/api/v1/volunteer')
      .set('Authorization', bearerToken({ role: 'user' }))
      .send({
        title: 'Walk dogs',
        description: 'Help at shelter on Saturday morning.',
        location: 'Ulaanbaatar',
        eventDate: '2026-06-15',
        requiredCount: 5,
      });

    expect(res.status).toBe(403);
    expect(mockVolunteer.createVolunteerPost).not.toHaveBeenCalled();
  });

  it('POST /api/v1/volunteer validates body', async () => {
    const res = await request(app)
      .post('/api/v1/volunteer')
      .set('Authorization', bearerToken({ role: 'ngo' }))
      .send({ title: '', description: '', location: '', eventDate: 'bad', requiredCount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/volunteer/:id/register maps closed post conflict', async () => {
    mockVolunteer.registerForVolunteerPost.mockRejectedValue(
      new ConflictError('Бүртгэл хаагдсан байна.', 'VOLUNTEER_POST_NOT_OPEN'),
    );

    const res = await request(app)
      .post('/api/v1/volunteer/00000000-0000-4000-8000-000000000040/register')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('VOLUNTEER_POST_NOT_OPEN');
  });

  it('DELETE /api/v1/volunteer/:id/register maps not registered conflict', async () => {
    mockVolunteer.unregisterFromVolunteerPost.mockRejectedValue(
      new ConflictError('Та энэ зарт бүртгүүлээгүй байна.', 'VOLUNTEER_POST_NOT_REGISTERED'),
    );

    const res = await request(app)
      .delete('/api/v1/volunteer/00000000-0000-4000-8000-000000000040/register')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('VOLUNTEER_POST_NOT_REGISTERED');
  });
});
