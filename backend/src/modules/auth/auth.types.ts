import type { UserAccountStatus } from './userStatus';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  status: UserAccountStatus;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
