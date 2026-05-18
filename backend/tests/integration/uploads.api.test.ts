jest.mock('../../src/modules/uploads/uploads.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as uploadsService from '../../src/modules/uploads/uploads.service';
import { ValidationError } from '../../src/shared/errors';
import { bearerToken } from '../helpers/bearerToken';

const mockUploads = jest.mocked(uploadsService);

describe('uploads API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POST /api/v1/uploads requires auth', async () => {
    const res = await request(app).post('/api/v1/uploads');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/uploads rejects missing file', async () => {
    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', bearerToken())
      .field('folder', 'pets');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockUploads.uploadImage).not.toHaveBeenCalled();
  });

  it('POST /api/v1/uploads maps service validation errors', async () => {
    mockUploads.uploadImage.mockRejectedValue(
      new ValidationError('Зураг файл буруу байна (JPG/PNG/GIF/WEBP)'),
    );

    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', bearerToken())
      .attach('file', Buffer.from('not-an-image'), 'bad.txt')
      .field('folder', 'pets');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Зураг файл');
  });

  it('POST /api/v1/uploads returns uploaded metadata', async () => {
    mockUploads.uploadImage.mockResolvedValue({
      publicId: 'pets/img-1',
      url: 'https://cdn.example/pets/img-1.jpg',
      bytes: 1024,
      width: 400,
      height: 300,
    });

    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', bearerToken())
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), 'photo.jpg')
      .field('folder', 'pets');

    expect(res.status).toBe(201);
    expect(res.body.publicId).toBe('pets/img-1');
    expect(res.body.url).toContain('cdn.example');
  });
});
