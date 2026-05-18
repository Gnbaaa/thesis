jest.mock('../../../src/modules/users/admin/admin.repository');

import * as repo from '../../../src/modules/users/admin/admin.repository';
import * as adminService from '../../../src/modules/users/admin/admin.service';
import { ForbiddenError, NotFoundError } from '../../../src/shared/errors';

const mockRepo = jest.mocked(repo);

const adminUser = {
  id: 'target-1',
  email: 'target@example.com',
  firstName: 'T',
  lastName: 'User',
  role: 'user' as const,
  status: 'active' as const,
  createdAt: new Date().toISOString(),
};

describe('admin.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listUsers', () => {
    it('delegates to repository', async () => {
      mockRepo.listAdminUsers.mockResolvedValue({ items: [], total: 0 });
      const out = await adminService.listUsers({ page: 1, pageSize: 20 });
      expect(out.total).toBe(0);
    });
  });

  describe('setUserRole', () => {
    it('throws when update does not apply', async () => {
      mockRepo.findAdminUserById.mockResolvedValue(adminUser);
      mockRepo.updateUserRole.mockResolvedValue({ updated: false });
      await expect(
        adminService.setUserRole({
          adminId: 'admin-1',
          targetId: 'target-1',
          role: 'ngo',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('prevents admin from changing own role', async () => {
      await expect(
        adminService.setUserRole({
          adminId: 'admin-1',
          targetId: 'admin-1',
          role: 'user',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws when target is missing', async () => {
      mockRepo.findAdminUserById.mockResolvedValue(null);
      await expect(
        adminService.setUserRole({
          adminId: 'admin-1',
          targetId: 'missing',
          role: 'ngo',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('updates role and returns user', async () => {
      mockRepo.findAdminUserById
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce({ ...adminUser, role: 'ngo' });
      mockRepo.updateUserRole.mockResolvedValue({ updated: true });

      const out = await adminService.setUserRole({
        adminId: 'admin-1',
        targetId: 'target-1',
        role: 'ngo',
      });
      expect(out?.role).toBe('ngo');
    });
  });

  describe('setUserStatus', () => {
    it('prevents admin from changing own status', async () => {
      await expect(
        adminService.setUserStatus({
          adminId: 'admin-1',
          targetId: 'admin-1',
          status: 'suspended',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws when update does not apply', async () => {
      mockRepo.findAdminUserById.mockResolvedValue(adminUser);
      mockRepo.updateUserStatus.mockResolvedValue({ updated: false });
      await expect(
        adminService.setUserStatus({
          adminId: 'admin-1',
          targetId: 'target-1',
          status: 'suspended',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('updates status', async () => {
      mockRepo.findAdminUserById
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce({ ...adminUser, status: 'suspended' });
      mockRepo.updateUserStatus.mockResolvedValue({ updated: true });

      const out = await adminService.setUserStatus({
        adminId: 'admin-1',
        targetId: 'target-1',
        status: 'suspended',
      });
      expect(out?.status).toBe('suspended');
    });
  });
});
