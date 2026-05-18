jest.mock('../../src/modules/notifications/notifications.service');

import request from 'supertest';
import { app } from '../../src/server';
import * as notificationsService from '../../src/modules/notifications/notifications.service';
import { bearerToken } from '../helpers/bearerToken';

const mockNotifications = jest.mocked(notificationsService);

describe('notifications API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /api/v1/notifications requires auth', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/notifications returns items', async () => {
    mockNotifications.listMyNotifications.mockResolvedValue({
      items: [{ id: 'n-1', title: 'Test', body: 'Body', isRead: false }],
    });

    const res = await request(app)
      .get('/api/v1/notifications?limit=20')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('GET /api/v1/notifications/unread-count returns count', async () => {
    mockNotifications.getMyUnreadCount.mockResolvedValue({ count: 4 });

    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(4);
  });

  it('POST /api/v1/notifications/mark-all-read updates notifications', async () => {
    mockNotifications.markAllMyNotificationsRead.mockResolvedValue({ updated: 2 });

    const res = await request(app)
      .post('/api/v1/notifications/mark-all-read')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(2);
  });

  it('GET /api/v1/notifications rejects limit above 100', async () => {
    const res = await request(app)
      .get('/api/v1/notifications?limit=500')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/notifications/unread-count requires auth', async () => {
    const res = await request(app).get('/api/v1/notifications/unread-count');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/notifications/unread-count rejects invalid type', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/unread-count?type=not_a_real_type')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/notifications/mark-all-read requires auth', async () => {
    const res = await request(app).post('/api/v1/notifications/mark-all-read');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/notifications/:id/read requires auth', async () => {
    const res = await request(app).post('/api/v1/notifications/n-1/read');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/notifications/:id/read marks single notification', async () => {
    mockNotifications.markMyNotificationRead.mockResolvedValue({ ok: true });

    const res = await request(app)
      .post('/api/v1/notifications/n-1/read')
      .set('Authorization', bearerToken());

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
