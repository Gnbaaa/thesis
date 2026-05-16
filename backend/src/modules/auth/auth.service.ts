import type { AuthUser } from './auth.types';
import * as repo from './auth.repository';
import { assertUserMayAuthenticate } from './userStatus';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ConflictError, UnauthorizedError } from '../../shared/errors';
import { issueTokenPair, verifyRefreshToken } from './auth.jwt';
import { sendEmail } from '../../shared/email';

export async function upsertGoogleUser(params: {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}): Promise<AuthUser> {
  const byGoogle = await repo.findUserByGoogleId(params.googleId);
  if (byGoogle) {
    const user = await repo.updateGoogleUserProfile({
      userId: byGoogle.id,
      firstName: params.firstName,
      lastName: params.lastName,
      avatarUrl: params.avatarUrl,
    });
    assertUserMayAuthenticate(user.status);
    return user;
  }

  const byEmail = await repo.findUserByEmail(params.email);
  if (byEmail) {
    const user = await repo.linkGoogleToExistingUser({
      userId: byEmail.id,
      googleId: params.googleId,
      firstName: params.firstName,
      lastName: params.lastName,
      avatarUrl: params.avatarUrl,
    });
    assertUserMayAuthenticate(user.status);
    return user;
  }

  const user = await repo.createUserFromGoogle({
    googleId: params.googleId,
    email: params.email,
    firstName: params.firstName,
    lastName: params.lastName,
    avatarUrl: params.avatarUrl,
  });
  assertUserMayAuthenticate(user.status);
  return user;
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const existing = await repo.findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError('Энэ и-мэйл аль хэдийн бүртгэлтэй байна', 'EMAIL_ALREADY_EXISTS');
  }
  const rounds = Math.max(10, Number(process.env.BCRYPT_ROUNDS ?? 10));
  const passwordHash = await bcrypt.hash(input.password, rounds);
  const user = await repo.createUserWithPassword({
    email: input.email,
    passwordHash,
    firstName: input.firstName ?? '',
    lastName: input.lastName ?? '',
    phone: input.phone,
  });
  const tokens = issueTokenPair(user);
  return { user, ...tokens };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const row = await repo.findUserByEmailWithPasswordHash(email);
  if (!row || !row.passwordHash) {
    throw new UnauthorizedError('И-мэйл эсвэл нууц үг буруу байна', 'INVALID_CREDENTIALS');
  }
  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('И-мэйл эсвэл нууц үг буруу байна', 'INVALID_CREDENTIALS');
  }
  assertUserMayAuthenticate(row.user.status);
  const tokens = issueTokenPair(row.user);
  return { user: row.user, ...tokens };
}

export async function refresh(
  refreshToken: string,
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const { userId } = verifyRefreshToken(refreshToken);
  const user = await repo.findUserById(userId);
  if (!user) {
    throw new UnauthorizedError('Refresh token хүчингүй байна', 'INVALID_REFRESH_TOKEN');
  }
  assertUserMayAuthenticate(user.status);
  const tokens = issueTokenPair(user);
  return { user, ...tokens };
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export async function forgotPassword(
  email: string,
): Promise<{ ok: true; token?: string; expiresInSeconds?: number }> {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    return { ok: true };
  }

  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256Hex(raw);
  const expiresInSeconds = 15 * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  await repo.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

  const frontendBase = (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(raw)}`;

  await sendEmail({
    to: user.email,
    subject: 'Нууц үг сэргээх хүсэлт',
    text: `Танд нууц үг сэргээх холбоос илгээсэн байна.\n\nСэргээх холбоос: ${resetUrl}\n\nХугацаа: 15 минут`,
    html: `<p>Танд нууц үг сэргээх холбоос илгээсэн байна.</p><p><a href="${resetUrl}">Нууц үг сэргээх</a></p><p>Хугацаа: 15 минут</p>`,
  });

  if (process.env.NODE_ENV === 'production') return { ok: true };
  return { ok: true, token: raw, expiresInSeconds };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
  const tokenHash = sha256Hex(token);
  const consumed = await repo.consumePasswordResetToken({ tokenHash });
  if (!consumed) {
    throw new UnauthorizedError('Token хүчингүй эсвэл хугацаа дууссан байна', 'INVALID_RESET_TOKEN');
  }
  const rounds = Math.max(10, Number(process.env.BCRYPT_ROUNDS ?? 10));
  const passwordHash = await bcrypt.hash(newPassword, rounds);
  await repo.updateUserPasswordHash({ userId: consumed.userId, passwordHash });
  return { ok: true };
}
