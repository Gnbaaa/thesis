import jwt, { type SignOptions } from 'jsonwebtoken';
import type { AuthUser, TokenPair } from './auth.types';
import { UnauthorizedError } from '../../shared/errors';

function requireSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set to a long random string');
  }
  return secret;
}

type AccessPayload = {
  sub: string;
  email: string;
  role: string;
  picture?: string;
  iat?: number;
  exp?: number;
};

type RefreshPayload = {
  sub: string;
  typ: 'refresh';
  iat?: number;
  exp?: number;
};

export function signAccessToken(user: AuthUser): string {
  const secret = requireSecret();
  const ttl = process.env.JWT_ACCESS_TTL ?? '15m';
  const options: SignOptions = { expiresIn: ttl as SignOptions['expiresIn'] };
  const payload: {
    sub: string;
    email: string;
    role: string;
    picture?: string;
  } = { sub: user.id, email: user.email, role: user.role };
  if (user.avatarUrl) {
    payload.picture = user.avatarUrl;
  }
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(userId: string): string {
  const secret = requireSecret();
  const ttl = process.env.JWT_REFRESH_TTL ?? '7d';
  const options: SignOptions = { expiresIn: ttl as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, typ: 'refresh' }, secret, options);
}

export function issueTokenPair(user: AuthUser): TokenPair {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id),
  };
}

export function verifyAccessToken(token: string): AuthUser {
  const secret = requireSecret();
  const payload = jwt.verify(token, secret) as AccessPayload;
  if (!payload?.sub || !payload.email || !payload.role) {
    throw new UnauthorizedError();
  }
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    avatarUrl: payload.picture ?? null,
  };
}

export function verifyRefreshToken(token: string): { userId: string } {
  const secret = requireSecret();
  const payload = jwt.verify(token, secret) as RefreshPayload;
  if (!payload?.sub || payload.typ !== 'refresh') {
    throw new UnauthorizedError('Refresh token хүчингүй байна', 'INVALID_REFRESH_TOKEN');
  }
  return { userId: payload.sub };
}
