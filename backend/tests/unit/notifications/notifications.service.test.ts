jest.mock('../../../src/modules/notifications/notifications.repository');

import * as repo from '../../../src/modules/notifications/notifications.repository';
import * as notificationsService from '../../../src/modules/notifications/notifications.service';

const mockRepo = jest.mocked(repo);

describe('notifications.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listMyNotifications', () => {
    it('lists all notifications by default', async () => {
      mockRepo.listNotifications.mockResolvedValue([{ id: 'n-1' } as never]);
      const out = await notificationsService.listMyNotifications({ userId: 'u-1', limit: 10 });
      expect(out.items).toHaveLength(1);
      expect(mockRepo.listNotificationsExcludingType).not.toHaveBeenCalled();
    });

    it('excludes type when requested', async () => {
      mockRepo.listNotificationsExcludingType.mockResolvedValue([]);
      await notificationsService.listMyNotifications({
        userId: 'u-1',
        limit: 5,
        excludeType: 'chat_message',
      });
      expect(mockRepo.listNotificationsExcludingType).toHaveBeenCalled();
    });
  });

  describe('markAllMyNotificationsReadWhere', () => {
    it('passes filters to repository', async () => {
      mockRepo.markAllReadWhere.mockResolvedValue(3);
      const out = await notificationsService.markAllMyNotificationsReadWhere({
        userId: 'u-1',
        type: 'donation_received',
        actionUrl: '/donations/1',
      });
      expect(out.updated).toBe(3);
    });
  });

  describe('markMyNotificationRead', () => {
    it('marks single notification', async () => {
      mockRepo.markRead.mockResolvedValue(undefined);
      const out = await notificationsService.markMyNotificationRead({ userId: 'u-1', id: 'n-1' });
      expect(out).toEqual({ ok: true });
    });
  });

  describe('getMyUnreadCount', () => {
    it('returns unread count', async () => {
      mockRepo.countUnread.mockResolvedValue(7);
      const out = await notificationsService.getMyUnreadCount('u-1');
      expect(out.count).toBe(7);
    });

    it('filters by type', async () => {
      mockRepo.countUnreadWhere.mockResolvedValue(2);
      const out = await notificationsService.getMyUnreadCountWhere({
        userId: 'u-1',
        type: 'chat_message',
      });
      expect(out.count).toBe(2);
    });
  });

  describe('notify', () => {
    it('creates notification', async () => {
      mockRepo.createNotification.mockResolvedValue(undefined);
      await notificationsService.notify({
        userId: 'u-1',
        type: 'donation_received',
        title: 'T',
        body: 'B',
      });
      expect(mockRepo.createNotification).toHaveBeenCalled();
    });
  });

  describe('notifySafe', () => {
    it('swallows repository errors', async () => {
      mockRepo.createNotification.mockRejectedValue(new Error('db down'));
      await expect(
        notificationsService.notifySafe({
          userId: 'u-1',
          type: 'adoption_request_sent',
          title: 'T',
          body: 'B',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
