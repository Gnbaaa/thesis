jest.mock('../../../src/modules/adoption/adoption.repository');
jest.mock('../../../src/infra/db/pool');
jest.mock('../../../src/modules/notifications/notifications.service', () => ({
  notifySafe: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/modules/users/users.service', () => ({
  getPublicProfileById: jest.fn().mockResolvedValue({ displayName: 'Requester' }),
}));

import * as repo from '../../../src/modules/adoption/adoption.repository';
import { getPool } from '../../../src/infra/db/pool';
import * as adoptionService from '../../../src/modules/adoption/adoption.service';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../src/shared/errors';

const mockRepo = jest.mocked(repo);
const mockGetPool = jest.mocked(getPool);

function mockDbClient(rowsByQuery: Array<{ rows: unknown[] }>) {
  let call = 0;
  const client = {
    query: jest.fn(async () => {
      const next = rowsByQuery[call] ?? { rows: [] };
      call += 1;
      return next;
    }),
    release: jest.fn(),
  };
  return client;
}

describe('adoption.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createRequest', () => {
    it('throws when pet is missing', async () => {
      const client = mockDbClient([{ rows: [] }, { rows: [] }]);
      mockGetPool.mockReturnValue({ connect: jest.fn().mockResolvedValue(client) } as never);

      await expect(
        adoptionService.createRequest({
          petId: 'pet-1',
          requesterId: 'u-1',
          reason: 'r',
          livingEnvironment: 'home',
          hasOwnedPetBefore: true,
          householdSize: 2,
          contactPhone: '9900',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects request when pet is already adopted', async () => {
      const client = mockDbClient([
        { rows: [] },
        { rows: [{ owner_id: 'owner-1', status: 'adopted', name: 'Luna' }] },
      ]);
      mockGetPool.mockReturnValue({ connect: jest.fn().mockResolvedValue(client) } as never);

      await expect(
        adoptionService.createRequest({
          petId: 'pet-1',
          requesterId: 'u-2',
          reason: 'r',
          livingEnvironment: 'home',
          hasOwnedPetBefore: true,
          householdSize: 2,
          contactPhone: '9900',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('forbids owner from requesting own pet', async () => {
      const client = mockDbClient([
        { rows: [] },
        { rows: [{ owner_id: 'owner-1', status: 'available', name: 'Luna' }] },
      ]);
      mockGetPool.mockReturnValue({ connect: jest.fn().mockResolvedValue(client) } as never);

      await expect(
        adoptionService.createRequest({
          petId: 'pet-1',
          requesterId: 'owner-1',
          reason: 'r',
          livingEnvironment: 'home',
          hasOwnedPetBefore: true,
          householdSize: 2,
          contactPhone: '9900',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('creates adoption request', async () => {
      const client = mockDbClient([
        { rows: [] },
        { rows: [{ owner_id: 'owner-1', status: 'available', name: 'Luna' }] },
        { rows: [{ id: 'req-1' }] },
        { rows: [] },
      ]);
      mockGetPool.mockReturnValue({ connect: jest.fn().mockResolvedValue(client) } as never);

      const out = await adoptionService.createRequest({
        petId: 'pet-1',
        requesterId: 'u-2',
        reason: 'r',
        livingEnvironment: 'home',
        hasOwnedPetBefore: true,
        householdSize: 2,
        contactPhone: '9900',
      });
      expect(out.id).toBe('req-1');
    });
  });

  describe('getMyRequests', () => {
    it('returns requester inbox', async () => {
      mockRepo.countPendingForRequester.mockResolvedValue(1);
      mockRepo.listForRequester.mockResolvedValue([]);
      const out = await adoptionService.getMyRequests({ requesterId: 'u-1', limit: 5 });
      expect(out.pendingCount).toBe(1);
    });
  });

  describe('getInbox', () => {
    it('aggregates pending count and items', async () => {
      mockRepo.countPendingForOwner.mockResolvedValue(2);
      mockRepo.listInboxForOwner.mockResolvedValue([{ id: 'r-1' } as never]);

      const out = await adoptionService.getInbox({ ownerId: 'owner-1', limit: 10 });
      expect(out.pendingCount).toBe(2);
      expect(out.items).toHaveLength(1);
    });
  });

  describe('getRequestDetail', () => {
    it('throws when request is not found for owner', async () => {
      mockRepo.getRequestDetailForOwner.mockResolvedValue(null);
      await expect(
        adoptionService.getRequestDetail({ requestId: 'r-1', ownerId: 'owner-1' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('resolveRequest', () => {
    it('rejects when request is already resolved', async () => {
      const client = mockDbClient([
        { rows: [] },
        {
          rows: [
            {
              id: 'r-1',
              pet_id: 'pet-1',
              status: 'approved',
              requester_id: 'u-2',
              pet_name: 'Luna',
            },
          ],
        },
      ]);
      mockGetPool.mockReturnValue({
        connect: jest.fn().mockResolvedValue(client),
      } as never);

      await expect(
        adoptionService.resolveRequest({
          requestId: 'r-1',
          ownerId: 'owner-1',
          action: 'reject',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('approves pending request and updates pet', async () => {
      const client = mockDbClient([
        { rows: [] },
        {
          rows: [
            {
              id: 'r-1',
              pet_id: 'pet-1',
              status: 'pending',
              requester_id: 'u-2',
              pet_name: 'Luna',
            },
          ],
        },
        { rows: [] },
        { rows: [] },
        { rows: [] },
        { rows: [] },
      ]);
      mockGetPool.mockReturnValue({
        connect: jest.fn().mockResolvedValue(client),
      } as never);

      const out = await adoptionService.resolveRequest({
        requestId: 'r-1',
        ownerId: 'owner-1',
        action: 'approve',
      });
      expect(out).toEqual({ ok: true });
    });

    it('rejects pending request', async () => {
      const client = mockDbClient([
        { rows: [] },
        {
          rows: [
            {
              id: 'r-1',
              pet_id: 'pet-1',
              status: 'pending',
              requester_id: 'u-2',
              pet_name: 'Luna',
            },
          ],
        },
        { rows: [] },
        { rows: [] },
      ]);
      mockGetPool.mockReturnValue({
        connect: jest.fn().mockResolvedValue(client),
      } as never);

      const out = await adoptionService.resolveRequest({
        requestId: 'r-1',
        ownerId: 'owner-1',
        action: 'reject',
      });
      expect(out).toEqual({ ok: true });
    });
  });
});
