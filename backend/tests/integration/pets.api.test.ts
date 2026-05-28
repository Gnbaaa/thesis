jest.mock('../../src/modules/pets/pets.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as petsService from '../../src/modules/pets/pets.service';
import { ForbiddenError, NotFoundError } from '../../src/shared/errors';
import { bearerToken } from '../helpers/bearerToken';

const mockPets = jest.mocked(petsService);

describe('pets API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/v1/pets returns paginated list', async () => {
    mockPets.listPets.mockResolvedValue({ items: [], total: 0 });

    const res = await request(app).get('/api/v1/pets?page=1&pageSize=8');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0, page: 1, pageSize: 8 });
  });

  it('GET /api/v1/pets/:id returns 404 when missing', async () => {
    mockPets.getPetByIdForViewer.mockRejectedValue(
      new NotFoundError('Амьтны зар олдсонгүй', 'PET_NOT_FOUND'),
    );

    const res = await request(app).get('/api/v1/pets/00000000-0000-4000-8000-000000000001');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PET_NOT_FOUND');
  });

  it('POST /api/v1/pets requires authentication', async () => {
    const res = await request(app).post('/api/v1/pets').send({
      name: 'Luna',
      species: 'dog',
      sex: 'female',
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/pets validates body', async () => {
    const res = await request(app)
      .post('/api/v1/pets')
      .set('Authorization', bearerToken({ role: 'ngo' }))
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/pets creates listing for NGO', async () => {
    mockPets.createPet.mockResolvedValue({
      id: 'pet-new',
      name: 'Luna',
    } as never);

    const res = await request(app)
      .post('/api/v1/pets')
      .set('Authorization', bearerToken({ role: 'ngo' }))
      .send({
        name: 'Luna',
        species: 'dog',
        sex: 'female',
        vaccinated: true,
        neutered: false,
        spayed: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Luna');
  });

  it('GET /api/v1/pets/:id rejects invalid uuid', async () => {
    const res = await request(app).get('/api/v1/pets/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/pets rejects pageSize above maximum', async () => {
    const res = await request(app).get('/api/v1/pets?page=1&pageSize=500');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH /api/v1/pets/:id requires authentication', async () => {
    const res = await request(app)
      .patch('/api/v1/pets/00000000-0000-4000-8000-000000000001')
      .send({ name: 'Luna' });
    expect(res.status).toBe(401);
  });

  it('PATCH /api/v1/pets/:id maps forbidden for non-owner', async () => {
    mockPets.updatePet.mockRejectedValue(
      new ForbiddenError('Та энэ амьтны зарыг засах эрхгүй байна.', 'PET_EDIT_FORBIDDEN'),
    );

    const res = await request(app)
      .patch('/api/v1/pets/00000000-0000-4000-8000-000000000001')
      .set('Authorization', bearerToken())
      .send({
        name: 'Luna',
        species: 'dog',
        sex: 'female',
        vaccinated: true,
        neutered: false,
        spayed: false,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PET_EDIT_FORBIDDEN');
  });

  it('DELETE /api/v1/pets/:id requires authentication', async () => {
    const res = await request(app).delete('/api/v1/pets/00000000-0000-4000-8000-000000000001');
    expect(res.status).toBe(401);
  });

  it('DELETE /api/v1/pets/:id maps forbidden for non-owner', async () => {
    mockPets.deletePet.mockRejectedValue(
      new ForbiddenError('Та энэ амьтны зарыг устгах эрхгүй байна.', 'PET_DELETE_FORBIDDEN'),
    );

    const res = await request(app)
      .delete('/api/v1/pets/00000000-0000-4000-8000-000000000001')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PET_DELETE_FORBIDDEN');
  });

  it('DELETE /api/v1/pets/:id deletes listing for owner', async () => {
    mockPets.deletePet.mockResolvedValue(undefined);

    const res = await request(app)
      .delete('/api/v1/pets/00000000-0000-4000-8000-000000000001')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(204);
    expect(mockPets.deletePet).toHaveBeenCalledWith({
      petId: '00000000-0000-4000-8000-000000000001',
      ownerId: expect.any(String),
    });
  });
});
