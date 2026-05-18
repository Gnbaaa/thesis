jest.mock('../../src/modules/adoption/adoption.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as adoptionService from '../../src/modules/adoption/adoption.service';
import { ConflictError, NotFoundError } from '../../src/shared/errors';
import { bearerToken } from '../helpers/bearerToken';

const mockAdoption = jest.mocked(adoptionService);

describe('adoption API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/v1/adoption/inbox requires auth', async () => {
    const res = await request(app).get('/api/v1/adoption/inbox');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/adoption/inbox returns inbox for owner', async () => {
    mockAdoption.getInbox.mockResolvedValue({ pendingCount: 2, items: [] });

    const res = await request(app)
      .get('/api/v1/adoption/inbox?limit=10')
      .set('Authorization', bearerToken({ role: 'ngo' }));

    expect(res.status).toBe(200);
    expect(res.body.pendingCount).toBe(2);
  });

  it('POST /api/v1/adoption/requests validates body', async () => {
    const res = await request(app)
      .post('/api/v1/adoption/requests')
      .set('Authorization', bearerToken())
      .send({ reason: 'too short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/adoption/requests creates request', async () => {
    mockAdoption.createRequest.mockResolvedValue({ id: 'req-1' });

    const res = await request(app)
      .post('/api/v1/adoption/requests')
      .set('Authorization', bearerToken())
      .send({
        petId: '00000000-0000-4000-8000-000000000010',
        reason: 'I love pets and have a safe home for adoption.',
        livingEnvironment: 'apartment',
        hasOwnedPetBefore: true,
        householdSize: 3,
        contactPhone: '99001122',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('req-1');
  });

  it('POST /api/v1/adoption/requests/:id/resolve validates action', async () => {
    const res = await request(app)
      .post('/api/v1/adoption/requests/00000000-0000-4000-8000-000000000020/resolve')
      .set('Authorization', bearerToken({ role: 'ngo' }))
      .send({ action: 'maybe' });

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/adoption/requests rejects invalid petId', async () => {
    const res = await request(app)
      .post('/api/v1/adoption/requests')
      .set('Authorization', bearerToken())
      .send({
        petId: 'not-a-uuid',
        reason: 'I love pets and have a safe home for adoption.',
        livingEnvironment: 'apartment',
        hasOwnedPetBefore: false,
        householdSize: 2,
        contactPhone: '99001122',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/adoption/requests maps pet not found', async () => {
    mockAdoption.createRequest.mockRejectedValue(
      new NotFoundError('Амьтны зар олдсонгүй', 'PET_NOT_FOUND'),
    );

    const res = await request(app)
      .post('/api/v1/adoption/requests')
      .set('Authorization', bearerToken())
      .send({
        petId: '00000000-0000-4000-8000-000000000010',
        reason: 'I love pets and have a safe home for adoption.',
        livingEnvironment: 'apartment',
        hasOwnedPetBefore: false,
        householdSize: 2,
        contactPhone: '99001122',
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PET_NOT_FOUND');
  });

  it('POST /api/v1/adoption/requests/:id/resolve maps already resolved conflict', async () => {
    mockAdoption.resolveRequest.mockRejectedValue(
      new ConflictError('Энэ хүсэлт аль хэдийн шийдвэрлэгдсэн байна.', 'ADOPTION_REQUEST_ALREADY_RESOLVED'),
    );

    const res = await request(app)
      .post('/api/v1/adoption/requests/00000000-0000-4000-8000-000000000020/resolve')
      .set('Authorization', bearerToken({ role: 'ngo' }))
      .send({ action: 'approve' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ADOPTION_REQUEST_ALREADY_RESOLVED');
  });
});
