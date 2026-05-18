jest.mock('../../../src/modules/auth/auth.repository');
jest.mock('../../../src/shared/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

import bcrypt from 'bcrypt';
import { issueTokenPair } from '../../../src/modules/auth/auth.jwt';
import * as repo from '../../../src/modules/auth/auth.repository';
import * as authService from '../../../src/modules/auth/auth.service';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../../../src/shared/errors';
import { mockAuthUser } from '../../helpers/mockUser';

const mockRepo = jest.mocked(repo);

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('rejects duplicate email', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(mockAuthUser());
      await expect(
        authService.register({
          email: 'dup@example.com',
          password: 'Secret123',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates user and returns tokens', async () => {
      const user = mockAuthUser({ email: 'new@example.com' });
      mockRepo.findUserByEmail.mockResolvedValue(null);
      mockRepo.createUserWithPassword.mockResolvedValue(user);

      const out = await authService.register({
        email: 'new@example.com',
        password: 'Secret123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(out.user.email).toBe('new@example.com');
      expect(out.accessToken).toBeTruthy();
      expect(out.refreshToken).toBeTruthy();
    });
  });

  describe('login', () => {
    it('rejects unknown email', async () => {
      mockRepo.findUserByEmailWithPasswordHash.mockResolvedValue(null);
      await expect(authService.login('x@y.com', 'Secret123')).rejects.toThrow(UnauthorizedError);
    });

    it('rejects wrong password', async () => {
      const hash = await bcrypt.hash('Correct1', 4);
      mockRepo.findUserByEmailWithPasswordHash.mockResolvedValue({
        user: mockAuthUser(),
        passwordHash: hash,
      });
      await expect(authService.login('test@example.com', 'Wrong1pass')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('rejects suspended account', async () => {
      const hash = await bcrypt.hash('Secret123', 4);
      mockRepo.findUserByEmailWithPasswordHash.mockResolvedValue({
        user: mockAuthUser({ status: 'suspended' }),
        passwordHash: hash,
      });
      await expect(authService.login('test@example.com', 'Secret123')).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('returns tokens for valid credentials', async () => {
      const password = 'Secret123';
      const hash = await bcrypt.hash(password, 4);
      const user = mockAuthUser();
      mockRepo.findUserByEmailWithPasswordHash.mockResolvedValue({ user, passwordHash: hash });

      const out = await authService.login(user.email, password);
      expect(out.user.id).toBe(user.id);
      expect(out.accessToken).toBeTruthy();
    });
  });

  describe('refresh', () => {
    it('rejects when user no longer exists', async () => {
      const user = mockAuthUser({ id: 'missing-user' });
      const { refreshToken } = issueTokenPair(user);
      mockRepo.findUserById.mockResolvedValue(null);
      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedError);
    });

    it('rejects suspended user', async () => {
      const user = mockAuthUser({ status: 'suspended' });
      const { refreshToken } = issueTokenPair(user);
      mockRepo.findUserById.mockResolvedValue(user);
      await expect(authService.refresh(refreshToken)).rejects.toThrow(ForbiddenError);
    });

    it('issues new tokens for active user', async () => {
      const user = mockAuthUser();
      const { refreshToken } = issueTokenPair(user);
      mockRepo.findUserById.mockResolvedValue(user);
      const out = await authService.refresh(refreshToken);
      expect(out.user.id).toBe(user.id);
      expect(out.accessToken).toBeTruthy();
    });
  });

  describe('forgotPassword', () => {
    it('returns ok without leaking unknown email', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      const out = await authService.forgotPassword('unknown@example.com');
      expect(out).toEqual({ ok: true });
      expect(mockRepo.createPasswordResetToken).not.toHaveBeenCalled();
    });

    it('creates reset token for existing user', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(mockAuthUser());
      mockRepo.createPasswordResetToken.mockResolvedValue(undefined);
      const out = await authService.forgotPassword('test@example.com');
      expect(out.ok).toBe(true);
      expect(mockRepo.createPasswordResetToken).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('rejects invalid token', async () => {
      mockRepo.consumePasswordResetToken.mockResolvedValue(null);
      await expect(authService.resetPassword('bad-token', 'Newpass1')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('updates password when token is valid', async () => {
      mockRepo.consumePasswordResetToken.mockResolvedValue({ userId: 'user-1' });
      mockRepo.updateUserPasswordHash.mockResolvedValue(undefined);
      const out = await authService.resetPassword('valid-token', 'Newpass1');
      expect(out).toEqual({ ok: true });
      expect(mockRepo.updateUserPasswordHash).toHaveBeenCalled();
    });
  });

  describe('upsertGoogleUser', () => {
    const googleParams = {
      googleId: 'g-1',
      email: 'google@example.com',
      firstName: 'G',
      lastName: 'User',
      avatarUrl: null,
    };

    it('returns existing google user', async () => {
      const user = mockAuthUser({ email: googleParams.email });
      mockRepo.findUserByGoogleId.mockResolvedValue(user);
      mockRepo.updateGoogleUserProfile.mockResolvedValue(user);

      const out = await authService.upsertGoogleUser(googleParams);
      expect(out.id).toBe(user.id);
      expect(mockRepo.linkGoogleToExistingUser).not.toHaveBeenCalled();
    });

    it('links google to email account', async () => {
      const user = mockAuthUser({ email: googleParams.email });
      mockRepo.findUserByGoogleId.mockResolvedValue(null);
      mockRepo.findUserByEmail.mockResolvedValue(user);
      mockRepo.linkGoogleToExistingUser.mockResolvedValue(user);

      const out = await authService.upsertGoogleUser(googleParams);
      expect(out.email).toBe(googleParams.email);
    });

    it('creates new google user', async () => {
      const user = mockAuthUser({ email: googleParams.email });
      mockRepo.findUserByGoogleId.mockResolvedValue(null);
      mockRepo.findUserByEmail.mockResolvedValue(null);
      mockRepo.createUserFromGoogle.mockResolvedValue(user);

      const out = await authService.upsertGoogleUser(googleParams);
      expect(mockRepo.createUserFromGoogle).toHaveBeenCalled();
      expect(out.email).toBe(googleParams.email);
    });
  });
});
