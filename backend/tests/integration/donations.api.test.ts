jest.mock('../../src/modules/donations/donations.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as donationsService from '../../src/modules/donations/donations.service';
import { ConflictError, NotFoundError } from '../../src/shared/errors';
import { bearerToken } from '../helpers/bearerToken';

const mockDonations = jest.mocked(donationsService);

describe('donations API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/v1/donations lists posts publicly', async () => {
    mockDonations.listDonationPosts.mockResolvedValue({ items: [], total: 0 });

    const res = await request(app).get('/api/v1/donations');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('GET /api/v1/donations/:id returns 404 when missing', async () => {
    mockDonations.getDonationPostById.mockRejectedValue(
      new NotFoundError('Хандивын зар олдсонгүй', 'DONATION_POST_NOT_FOUND'),
    );

    const res = await request(app).get('/api/v1/donations/00000000-0000-4000-8000-000000000030');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DONATION_POST_NOT_FOUND');
  });

  it('POST /api/v1/donations/:id/donate requires auth', async () => {
    const res = await request(app)
      .post('/api/v1/donations/00000000-0000-4000-8000-000000000030/donate')
      .send({ amount: 5000, paymentMethod: 'card' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/donations/:id/donate validates amount', async () => {
    const res = await request(app)
      .post('/api/v1/donations/00000000-0000-4000-8000-000000000030/donate')
      .set('Authorization', bearerToken())
      .send({ amount: 10, paymentMethod: 'card' });

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/donations/:id/donate initiates payment', async () => {
    mockDonations.initiateDonation.mockResolvedValue({
      clientSecret: 'cs_test',
      transactionId: 'tx-1',
      amountMinor: 5000,
      currency: 'usd',
    });

    const res = await request(app)
      .post('/api/v1/donations/00000000-0000-4000-8000-000000000030/donate')
      .set('Authorization', bearerToken())
      .send({ amount: 5000, paymentMethod: 'card' });

    expect(res.status).toBe(201);
    expect(res.body.clientSecret).toBe('cs_test');
  });

  it('POST /api/v1/donations/:id/donate maps business conflict', async () => {
    mockDonations.initiateDonation.mockRejectedValue(
      new ConflictError('Энэ зар хаагдсан тул хандив хүлээж авах боломжгүй.', 'DONATION_POST_CLOSED'),
    );

    const res = await request(app)
      .post('/api/v1/donations/00000000-0000-4000-8000-000000000030/donate')
      .set('Authorization', bearerToken())
      .send({ amount: 5000, paymentMethod: 'card' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DONATION_POST_CLOSED');
  });

  it('GET /api/v1/donations/:id rejects invalid uuid', async () => {
    const res = await request(app).get('/api/v1/donations/not-a-uuid');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/donations forbids regular users from creating posts', async () => {
    const res = await request(app)
      .post('/api/v1/donations')
      .set('Authorization', bearerToken({ role: 'user' }))
      .send({
        title: 'Help shelter',
        description: 'We need food and medicine for rescued animals this month.',
        goalAmount: 500000,
      });

    expect(res.status).toBe(403);
    expect(mockDonations.createDonationPost).not.toHaveBeenCalled();
  });

  it('POST /api/v1/donations validates create body', async () => {
    const res = await request(app)
      .post('/api/v1/donations')
      .set('Authorization', bearerToken({ role: 'ngo' }))
      .send({ title: '', description: 'short', goalAmount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
