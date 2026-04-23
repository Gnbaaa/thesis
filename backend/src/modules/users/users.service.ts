import * as repo from './users.repository';
import { NotFoundError } from '../../shared/errors';
import type { UserProfile } from './users.types';
import { uploadImage } from '../../shared/storage';

export async function getMe(userId: string): Promise<UserProfile> {
  const user = await repo.findMe(userId);
  if (!user) throw new NotFoundError('Хэрэглэгч олдсонгүй', 'USER_NOT_FOUND');
  return user;
}

export async function uploadMyAvatar(params: { userId: string; buffer: Buffer }): Promise<UserProfile> {
  const uploaded = await uploadImage({ buffer: params.buffer, folder: 'avatars' });
  await repo.setAvatarPublicId({ userId: params.userId, avatarPublicId: uploaded.publicId });
  return getMe(params.userId);
}

