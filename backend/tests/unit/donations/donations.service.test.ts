jest.mock('../../../src/modules/donations/donations.repository');
jest.mock('../../../src/shared/cache', () => ({
  wrap: async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
  delByPrefix: jest.fn().mockResolvedValue(undefined),
  buildListCacheKey: (prefix: string, query: object) => `${prefix}${JSON.stringify(query)}`,
  LIST_CACHE_TTL_SEC: 60,
}));
jest.mock('../../../src/modules/donations/payment.adapter');
jest.mock('../../../src/modules/notifications/notifications.service', () => ({
  notifySafe: jest.fn().mockResolvedValue(undefined),
}));

import * as repo from '../../../src/modules/donations/donations.repository';
import * as payments from '../../../src/modules/donations/payment.adapter';
import * as donationsService from '../../../src/modules/donations/donations.service';
import * as notificationsService from '../../../src/modules/notifications/notifications.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../src/shared/errors';

const mockRepo = jest.mocked(repo);
const mockPayments = jest.mocked(payments);

const activePost = {
  id: 'post-1',
  title: 'Help shelter',
  description: 'Need funds',
  goalAmount: 100_000,
  collectedAmount: 10_000,
  status: 'active' as const,
  photoUrl: null,
  owner: { id: 'owner-1', displayName: 'Shelter' },
  createdAt: new Date().toISOString(),
};

describe('donations.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getDonationPostById', () => {
    it('throws when post is missing', async () => {
      mockRepo.findDonationPostById.mockResolvedValue(null);
      await expect(donationsService.getDonationPostById('x')).rejects.toThrow(NotFoundError);
    });
  });

  describe('initiateDonation', () => {
    it('rejects closed post', async () => {
      mockRepo.findDonationPostById.mockResolvedValue({ ...activePost, status: 'completed' });
      await expect(
        donationsService.initiateDonation({
          postId: 'post-1',
          donor: { id: 'donor-1', fallbackName: 'Donor' },
          body: { amount: 5000, paymentMethod: 'card' },
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('rejects self-donation', async () => {
      mockRepo.findDonationPostById.mockResolvedValue(activePost);
      await expect(
        donationsService.initiateDonation({
          postId: 'post-1',
          donor: { id: 'owner-1', fallbackName: 'Owner' },
          body: { amount: 5000, paymentMethod: 'card' },
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('creates payment intent and pending transaction', async () => {
      mockRepo.findDonationPostById.mockResolvedValue(activePost);
      mockRepo.findUserDisplayName.mockResolvedValue('Donor Name');
      mockPayments.createPaymentIntent.mockResolvedValue({
        id: 'pi_test',
        clientSecret: 'cs_test',
      });
      mockRepo.createPendingDonationTransaction.mockResolvedValue({ txId: 'tx-1' });

      const out = await donationsService.initiateDonation({
        postId: 'post-1',
        donor: { id: 'donor-1', fallbackName: 'Donor' },
        body: { amount: 5000, paymentMethod: 'card' },
      });

      expect(out.clientSecret).toBe('cs_test');
      expect(out.transactionId).toBe('tx-1');
      expect(mockPayments.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          amountMinor: 5000,
          metadata: expect.objectContaining({ postId: 'post-1', donorId: 'donor-1' }),
        }),
      );
    });
  });

  describe('createDonationPost', () => {
    it('creates post with trimmed fields', async () => {
      mockRepo.createDonationPost.mockResolvedValue(activePost);
      await donationsService.createDonationPost({
        ownerId: 'owner-1',
        body: {
          title: '  Goal  ',
          description: '  Help  ',
          goalAmount: 50_000,
          status: 'active',
          photoPublicId: '  img  ',
        },
      });
      expect(mockRepo.createDonationPost).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Goal', photoPublicId: 'img' }),
      );
    });
  });

  describe('handleStripeEvent', () => {
    it('sends notifications when payment succeeds', async () => {
      mockRepo.finalizeDonationByPaymentIntent.mockResolvedValue({
        bumped: true,
        postId: 'post-1',
        amount: 5000,
      });
      mockRepo.findDonationNotifyContextByPaymentIntent.mockResolvedValue({
        ownerId: 'owner-1',
        postId: 'post-1',
        postTitle: 'Help',
        donorDisplayName: 'Donor',
        amount: 5000,
        goalAmount: 5000,
        status: 'completed',
      });

      await donationsService.handleStripeEvent({
        id: 'evt_4',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_4' } },
      } as payments.StripeEvent);

      expect(jest.mocked(notificationsService.notifySafe)).toHaveBeenCalledTimes(2);
    });

    it('finalizes succeeded payment intent', async () => {
      mockRepo.finalizeDonationByPaymentIntent.mockResolvedValue({
        bumped: true,
        postId: 'post-1',
        amount: 5000,
      });
      mockRepo.findDonationNotifyContextByPaymentIntent.mockResolvedValue(null);

      const out = await donationsService.handleStripeEvent({
        id: 'evt_1',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_1' } },
      } as payments.StripeEvent);

      expect(out).toEqual({ handled: true });
    });

    it('marks failed payment intent', async () => {
      mockRepo.markDonationFailedByPaymentIntent.mockResolvedValue(undefined);
      const out = await donationsService.handleStripeEvent({
        id: 'evt_2',
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_2' } },
      } as payments.StripeEvent);
      expect(out).toEqual({ handled: true });
    });

    it('ignores unrelated events', async () => {
      const out = await donationsService.handleStripeEvent({
        id: 'evt_3',
        type: 'customer.created',
        data: { object: {} },
      } as payments.StripeEvent);
      expect(out).toEqual({ handled: false });
    });
  });

  describe('updateDonationPost', () => {
    it('forbids non-owner non-admin', async () => {
      mockRepo.findDonationPostOwnerId.mockResolvedValue('owner-1');
      await expect(
        donationsService.updateDonationPost({
          id: 'post-1',
          user: { id: 'other', role: 'user' },
          body: {
            title: 'T',
            description: 'D',
            goalAmount: 1000,
            status: 'active',
            photoPublicId: null,
          },
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows admin to edit any post', async () => {
      mockRepo.findDonationPostOwnerId.mockResolvedValue('owner-1');
      mockRepo.updateDonationPost.mockResolvedValue(activePost);
      const out = await donationsService.updateDonationPost({
        id: 'post-1',
        user: { id: 'admin-1', role: 'admin' },
        body: {
          title: ' Updated ',
          description: ' Desc ',
          goalAmount: 2000,
          status: 'active',
          photoPublicId: '  ',
        },
      });
      expect(out.title).toBe('Help shelter');
      expect(mockRepo.updateDonationPost).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated', photoPublicId: null }),
      );
    });
  });
});
