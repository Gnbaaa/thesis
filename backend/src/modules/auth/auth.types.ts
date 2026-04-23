export type AuthUser = {
  id: string;
  email: string;
  role: string;
  avatarUrl: string | null;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
