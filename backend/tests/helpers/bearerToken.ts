import { signAccessToken } from '../../src/modules/auth/auth.jwt';
import { mockAuthUser } from './mockUser';
import type { AuthUser } from '../../src/modules/auth/auth.types';

export function bearerToken(overrides: Partial<AuthUser> = {}): string {
  return `Bearer ${signAccessToken(mockAuthUser(overrides))}`;
}
