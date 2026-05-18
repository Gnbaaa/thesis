jest.mock('../../src/modules/pets/pets.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as petsService from '../../src/modules/pets/pets.service';
import { NotFoundError } from '../../src/shared/errors';
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
});
