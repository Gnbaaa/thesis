import { ForbiddenError } from '../../../src/shared/errors';
import {
  assertUserMayAuthenticate,
  normaliseUserStatus,
} from '../../../src/modules/auth/userStatus';

describe('userStatus', () => {
  describe('normaliseUserStatus', () => {
    it('returns active for unknown values', () => {
      expect(normaliseUserStatus(undefined)).toBe('active');
      expect(normaliseUserStatus('bogus')).toBe('active');
    });

    it('preserves suspended and closed', () => {
      expect(normaliseUserStatus('suspended')).toBe('suspended');
      expect(normaliseUserStatus('closed')).toBe('closed');
    });
  });

  describe('assertUserMayAuthenticate', () => {
    it('allows active users', () => {
      expect(() => assertUserMayAuthenticate('active')).not.toThrow();
    });

    it('rejects suspended users', () => {
      expect(() => assertUserMayAuthenticate('suspended')).toThrow(ForbiddenError);
      try {
        assertUserMayAuthenticate('suspended');
      } catch (e) {
        expect((e as ForbiddenError).code).toBe('USER_SUSPENDED');
      }
    });

    it('rejects closed users', () => {
      expect(() => assertUserMayAuthenticate('closed')).toThrow(ForbiddenError);
      try {
        assertUserMayAuthenticate('closed');
      } catch (e) {
        expect((e as ForbiddenError).code).toBe('USER_ACCOUNT_CLOSED');
      }
    });
  });
});
