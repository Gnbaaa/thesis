jest.mock('../../../src/modules/volunteer/volunteer.repository');
jest.mock('../../../src/shared/cache', () => ({
  wrap: async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
  delByPrefix: jest.fn().mockResolvedValue(undefined),
  buildListCacheKey: (prefix: string, query: object) => `${prefix}${JSON.stringify(query)}`,
  LIST_CACHE_TTL_SEC: 60,
}));
jest.mock('../../../src/modules/users/users.service');
jest.mock('../../../src/modules/notifications/notifications.service', () => ({
  notifySafe: jest.fn().mockResolvedValue(undefined),
}));

import * as repo from '../../../src/modules/volunteer/volunteer.repository';
import * as usersService from '../../../src/modules/users/users.service';
import * as volunteerService from '../../../src/modules/volunteer/volunteer.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../src/shared/errors';

const mockRepo = jest.mocked(repo);
const mockUsers = jest.mocked(usersService);

const activePost = {
  id: 'vp-1',
  title: 'Walk dogs',
  description: 'Weekend',
  location: 'UB',
  eventDate: '2026-06-01',
  requiredCount: 5,
  registeredCount: 1,
  status: 'active' as const,
  photoUrl: null,
  owner: { id: 'owner-1', displayName: 'NGO' },
  isRegisteredByViewer: false,
  createdAt: new Date().toISOString(),
};

describe('volunteer.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getVolunteerPostById', () => {
    it('throws when missing', async () => {
      mockRepo.findVolunteerPostById.mockResolvedValue(null);
      await expect(volunteerService.getVolunteerPostById('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createVolunteerPost', () => {
    it('normalises photo and trims text fields', async () => {
      mockRepo.createVolunteerPost.mockResolvedValue(activePost);
      await volunteerService.createVolunteerPost({
        ownerId: 'owner-1',
        body: {
          title: '  Walk  ',
          description: '  Help  ',
          location: '  UB  ',
          eventDate: '2026-06-01',
          requiredCount: 3,
          status: 'active',
          photoPublicId: '  pic/id  ',
        },
      });
      expect(mockRepo.createVolunteerPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Walk',
          photoPublicId: 'pic/id',
        }),
      );
    });
  });

  describe('updateVolunteerPost', () => {
    it('allows admin to edit', async () => {
      mockRepo.findVolunteerPostOwnerId.mockResolvedValue('owner-1');
      mockRepo.updateVolunteerPost.mockResolvedValue(activePost);
      await volunteerService.updateVolunteerPost({
        id: 'vp-1',
        user: { id: 'admin-1', role: 'admin' },
        body: {
          title: 'T',
          description: 'D',
          location: 'L',
          eventDate: '2026-06-01',
          requiredCount: 2,
          status: 'active',
          photoPublicId: null,
        },
      });
      expect(mockRepo.updateVolunteerPost).toHaveBeenCalled();
    });

    it('throws when update returns null', async () => {
      mockRepo.findVolunteerPostOwnerId.mockResolvedValue('owner-1');
      mockRepo.updateVolunteerPost.mockResolvedValue(null);
      await expect(
        volunteerService.updateVolunteerPost({
          id: 'vp-1',
          user: { id: 'owner-1', role: 'ngo' },
          body: {
            title: 'T',
            description: 'D',
            location: 'L',
            eventDate: '2026-06-01',
            requiredCount: 2,
            status: 'active',
            photoPublicId: null,
          },
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('registerForVolunteerPost', () => {
    it('throws when post is missing', async () => {
      mockRepo.findVolunteerPostById.mockResolvedValue(null);
      await expect(
        volunteerService.registerForVolunteerPost({ postId: 'vp-1', userId: 'u-1' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects registration on closed post', async () => {
      mockRepo.findVolunteerPostById.mockResolvedValue({ ...activePost, status: 'completed' });
      await expect(
        volunteerService.registerForVolunteerPost({ postId: 'vp-1', userId: 'u-2' }),
      ).rejects.toThrow(ConflictError);
    });

    it('rejects owner self-registration', async () => {
      mockRepo.findVolunteerPostById.mockResolvedValue(activePost);
      await expect(
        volunteerService.registerForVolunteerPost({ postId: 'vp-1', userId: 'owner-1' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('returns post without duplicate insert when already registered', async () => {
      const registered = { ...activePost, isRegisteredByViewer: true };
      mockRepo.findVolunteerPostById.mockResolvedValue(registered);
      const out = await volunteerService.registerForVolunteerPost({
        postId: 'vp-1',
        userId: 'u-2',
      });
      expect(out?.isRegisteredByViewer).toBe(true);
      expect(mockRepo.createVolunteerRegistration).not.toHaveBeenCalled();
    });

    it('creates registration and notifies owner', async () => {
      mockRepo.findVolunteerPostById
        .mockResolvedValueOnce(activePost)
        .mockResolvedValueOnce({ ...activePost, isRegisteredByViewer: true, registeredCount: 2 });
      mockUsers.getPublicProfileById.mockResolvedValue({ displayName: 'Volunteer' });
      mockRepo.createVolunteerRegistration.mockResolvedValue(undefined);

      await volunteerService.registerForVolunteerPost({ postId: 'vp-1', userId: 'u-2' });
      expect(mockRepo.createVolunteerRegistration).toHaveBeenCalledWith('vp-1', 'u-2');
    });
  });

  describe('unregisterFromVolunteerPost', () => {
    it('throws when not registered', async () => {
      mockRepo.findVolunteerPostById.mockResolvedValue(activePost);
      await expect(
        volunteerService.unregisterFromVolunteerPost({ postId: 'vp-1', userId: 'u-2' }),
      ).rejects.toThrow(ConflictError);
    });

    it('deletes registration', async () => {
      mockRepo.findVolunteerPostById
        .mockResolvedValueOnce({ ...activePost, isRegisteredByViewer: true })
        .mockResolvedValueOnce(activePost);
      mockRepo.deleteVolunteerRegistration.mockResolvedValue(undefined);

      await volunteerService.unregisterFromVolunteerPost({ postId: 'vp-1', userId: 'u-2' });
      expect(mockRepo.deleteVolunteerRegistration).toHaveBeenCalledWith('vp-1', 'u-2');
    });
  });
});
