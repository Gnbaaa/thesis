jest.mock('../../src/modules/ngo/ngo.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as ngoService from '../../src/modules/ngo/ngo.service';
import { bearerToken } from '../helpers/bearerToken';

const mockNgo = jest.mocked(ngoService);

describe('ngo API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('POST /api/v1/ngo/applications requires auth', async () => {
    const res = await request(app).post('/api/v1/ngo/applications');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/ngo/applications rejects missing document', async () => {
    const res = await request(app)
      .post('/api/v1/ngo/applications')
      .set('Authorization', bearerToken())
      .field('orgName', 'Test NGO')
      .field('regNumber', '1234567')
      .field('orgAddress', 'Ulaanbaatar')
      .field('activityDirection', 'Animal rescue')
      .field('contactEmail', 'ngo@example.com')
      .field('contactPhone', '99001122')
      .field('description', 'We rescue and rehome animals in UB.');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockNgo.submitNgoApplication).not.toHaveBeenCalled();
  });

  it('POST /api/v1/ngo/applications validates body fields', async () => {
    const res = await request(app)
      .post('/api/v1/ngo/applications')
      .set('Authorization', bearerToken())
      .attach('document', Buffer.from('%PDF-1.4'), 'license.pdf')
      .field('orgName', '')
      .field('regNumber', '')
      .field('orgAddress', '')
      .field('activityDirection', '')
      .field('contactEmail', 'not-email')
      .field('contactPhone', '')
      .field('description', 'short');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockNgo.submitNgoApplication).not.toHaveBeenCalled();
  });

  it('POST /api/v1/ngo/applications creates application', async () => {
    mockNgo.submitNgoApplication.mockResolvedValue({
      id: 'app-1',
      status: 'pending',
    } as never);

    const res = await request(app)
      .post('/api/v1/ngo/applications')
      .set('Authorization', bearerToken())
      .attach('document', Buffer.from('%PDF-1.4'), 'license.pdf')
      .field('orgName', 'Test NGO')
      .field('regNumber', '1234567')
      .field('orgAddress', 'Ulaanbaatar')
      .field('activityDirection', 'Animal rescue')
      .field('contactEmail', 'ngo@example.com')
      .field('contactPhone', '99001122')
      .field('description', 'We rescue and rehome animals in UB.');

    expect(res.status).toBe(201);
    expect(res.body.application.id).toBe('app-1');
  });
});
