import type { AuthUser } from '../../src/modules/auth/auth.types';

export function mockAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'test@example.com',
    role: 'user',
    avatarUrl: null,
    status: 'active',
    ...overrides,
  };
}
