import type { z } from 'zod';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors';
import * as repo from './volunteer.repository';
import type { createVolunteerPostBody, updateVolunteerPostBody } from './volunteer.schema';
import type { VolunteerPostListQuery } from './volunteer.types';

type CreateBody = z.infer<typeof createVolunteerPostBody>;
type UpdateBody = z.infer<typeof updateVolunteerPostBody>;

function normalisePhoto(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function listVolunteerPosts(query: VolunteerPostListQuery) {
  return await repo.listVolunteerPosts(query);
}

export async function getVolunteerPostById(id: string, viewerId: string | null = null) {
  const post = await repo.findVolunteerPostById(id, viewerId);
  if (!post) {
    throw new NotFoundError('Сайн дурын зар олдсонгүй', 'VOLUNTEER_POST_NOT_FOUND');
  }
  return post;
}

export async function registerForVolunteerPost(params: { postId: string; userId: string }) {
  const post = await repo.findVolunteerPostById(params.postId, params.userId);
  if (!post) {
    throw new NotFoundError('Сайн дурын зар олдсонгүй', 'VOLUNTEER_POST_NOT_FOUND');
  }
  if (post.status !== 'active') {
    throw new ConflictError('Бүртгэл хаагдсан байна.', 'VOLUNTEER_POST_NOT_OPEN');
  }
  if (post.owner.id === params.userId) {
    throw new ForbiddenError(
      'Та өөрийн зарт бүртгүүлэх боломжгүй.',
      'VOLUNTEER_POST_REGISTER_SELF_FORBIDDEN',
    );
  }
  if (post.isRegisteredByViewer) {
    return await repo.findVolunteerPostById(params.postId, params.userId);
  }
  await repo.createVolunteerRegistration(params.postId, params.userId);
  return await repo.findVolunteerPostById(params.postId, params.userId);
}

export async function unregisterFromVolunteerPost(params: { postId: string; userId: string }) {
  const post = await repo.findVolunteerPostById(params.postId, params.userId);
  if (!post) {
    throw new NotFoundError('Сайн дурын зар олдсонгүй', 'VOLUNTEER_POST_NOT_FOUND');
  }
  if (!post.isRegisteredByViewer) {
    throw new ConflictError('Та энэ зарт бүртгүүлээгүй байна.', 'VOLUNTEER_POST_NOT_REGISTERED');
  }
  await repo.deleteVolunteerRegistration(params.postId, params.userId);
  return await repo.findVolunteerPostById(params.postId, params.userId);
}

export async function createVolunteerPost(params: { ownerId: string; body: CreateBody }) {
  const b = params.body;
  return await repo.createVolunteerPost({
    ownerId: params.ownerId,
    title: b.title.trim(),
    description: b.description.trim(),
    location: b.location.trim(),
    eventDate: b.eventDate,
    requiredCount: b.requiredCount,
    status: b.status,
    photoPublicId: normalisePhoto(b.photoPublicId ?? null),
  });
}

export async function updateVolunteerPost(params: {
  id: string;
  user: { id: string; role: string };
  body: UpdateBody;
}) {
  const ownerId = await repo.findVolunteerPostOwnerId(params.id);
  if (!ownerId) {
    throw new NotFoundError('Сайн дурын зар олдсонгүй', 'VOLUNTEER_POST_NOT_FOUND');
  }
  if (ownerId !== params.user.id && params.user.role !== 'admin') {
    throw new ForbiddenError('Та энэ зарыг засах эрхгүй байна.', 'VOLUNTEER_POST_EDIT_FORBIDDEN');
  }

  const b = params.body;
  const updated = await repo.updateVolunteerPost({
    id: params.id,
    ownerId,
    title: b.title.trim(),
    description: b.description.trim(),
    location: b.location.trim(),
    eventDate: b.eventDate,
    requiredCount: b.requiredCount,
    status: b.status,
    photoPublicId: normalisePhoto(b.photoPublicId ?? null),
  });
  if (!updated) {
    throw new NotFoundError('Сайн дурын зар олдсонгүй', 'VOLUNTEER_POST_NOT_FOUND');
  }
  return updated;
}
