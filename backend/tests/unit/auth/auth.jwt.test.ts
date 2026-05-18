import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../../src/shared/errors';
import {
  issueTokenPair,
  signAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/modules/auth/auth.jwt';
import { mockAuthUser } from '../../helpers/mockUser';

describe('auth.jwt', () => {
  const user = mockAuthUser({ id: 'jwt-user-1', email: 'jwt@example.com', role: 'ngo' });

  it('issues access and refresh tokens', () => {
    const { accessToken, refreshToken } = issueTokenPair(user);
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();

    const access = verifyAccessToken(accessToken);
    expect(access.id).toBe(user.id);
    expect(access.email).toBe(user.email);
    expect(access.role).toBe(user.role);

    const { userId } = verifyRefreshToken(refreshToken);
    expect(userId).toBe(user.id);
  });

  it('includes picture claim when avatar is set', () => {
    const withAvatar = mockAuthUser({ avatarUrl: 'https://cdn.example/a.png' });
    const token = signAccessToken(withAvatar);
    const decoded = jwt.decode(token) as { picture?: string };
    expect(decoded.picture).toBe('https://cdn.example/a.png');
  });

  it('rejects invalid refresh token type', () => {
    const secret = process.env.JWT_SECRET!;
    const bad = jwt.sign({ sub: user.id, typ: 'access' }, secret, { expiresIn: '1h' });
    expect(() => verifyRefreshToken(bad)).toThrow(UnauthorizedError);
  });

  it('rejects tampered access token', () => {
    expect(() => verifyAccessToken('not-a-jwt')).toThrow();
  });
});
