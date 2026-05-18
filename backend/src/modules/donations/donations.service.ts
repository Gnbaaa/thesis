import type { z } from 'zod';
import * as cache from '../../shared/cache';
import { logger } from '../../shared/logger';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors';
import * as notificationsService from '../notifications/notifications.service';
import * as repo from './donations.repository';
import * as payments from './payment.adapter';
import type { StripeEvent } from './payment.adapter';
import type {
  createDonationPostBody,
  donateBody,
  updateDonationPostBody,
} from './donations.schema';
import type {
  DonationPostListQuery,
  InitiateDonationResult,
  OwnerDonationActivityReport,
} from './donations.types';

type CreateBody = z.infer<typeof createDonationPostBody>;
type UpdateBody = z.infer<typeof updateDonationPostBody>;
type DonateBody = z.infer<typeof donateBody>;

const PAYMENT_CURRENCY = 'usd';

function normalisePhoto(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const DONATIONS_LIST_CACHE_PREFIX = 'donations:list:';

async function invalidateDonationsListCache(): Promise<void> {
  await cache.delByPrefix(DONATIONS_LIST_CACHE_PREFIX);
}

export async function listDonationPosts(query: DonationPostListQuery) {
  const key = cache.buildListCacheKey(DONATIONS_LIST_CACHE_PREFIX, query);
  return cache.wrap(key, cache.LIST_CACHE_TTL_SEC, () => repo.listDonationPosts(query));
}

/**
 * UC-014: Үйл ажиллагааны тайлан → Хандивын таб.
 * Эзэмшигчийн зарт ирсэн нийт хандивын дүн, амжилттай гүйлгээний тоо,
 * сүүлийн 7 хоногийн идэвх, мөн жагсаалт.
 */
export async function getOwnerActivityReport(
  ownerId: string,
): Promise<OwnerDonationActivityReport> {
  return await repo.getOwnerDonationActivityReport(ownerId, { transactionsLimit: 50 });
}

export async function getDonationPostById(id: string) {
  const post = await repo.findDonationPostById(id);
  if (!post) {
    throw new NotFoundError('Хандивын зар олдсонгүй', 'DONATION_POST_NOT_FOUND');
  }
  return post;
}

export async function createDonationPost(params: { ownerId: string; body: CreateBody }) {
  const b = params.body;
  const created = await repo.createDonationPost({
    ownerId: params.ownerId,
    title: b.title.trim(),
    description: b.description.trim(),
    goalAmount: b.goalAmount,
    status: b.status,
    photoPublicId: normalisePhoto(b.photoPublicId ?? null),
  });
  await invalidateDonationsListCache();
  return created;
}

/**
 * Хандив өгөх урсгалын эхний алхам:
 * - Зар нь идэвхтэй эсэх, эзэмшигч өөрөө хандивлах гэж байгаа эсэхийг шалгана.
 * - Stripe PaymentIntent үүсгэнэ (test mode-д USD валютаар; payment.adapter дотор тайлбартай).
 * - `pending` статустай гүйлгээг хадгална. Цугларсан дүнг энд НЭМЭХГҮЙ —
 *   Stripe webhook ирмэгц `finalizeDonationByPaymentIntent` дотор шинэчлэгдэнэ.
 */
export async function initiateDonation(params: {
  postId: string;
  donor: { id: string; fallbackName: string };
  body: DonateBody;
}): Promise<InitiateDonationResult> {
  const post = await repo.findDonationPostById(params.postId);
  if (!post) {
    throw new NotFoundError('Хандивын зар олдсонгүй', 'DONATION_POST_NOT_FOUND');
  }
  if (post.status !== 'active') {
    throw new ConflictError(
      'Энэ зар хаагдсан тул хандив хүлээж авах боломжгүй.',
      'DONATION_POST_CLOSED',
    );
  }
  if (post.owner.id === params.donor.id) {
    throw new ForbiddenError(
      'Та өөрийн зарт хандивлах боломжгүй.',
      'DONATION_POST_DONATE_SELF_FORBIDDEN',
    );
  }
  const displayName =
    (await repo.findUserDisplayName(params.donor.id))?.trim() ||
    params.donor.fallbackName ||
    'Хандивлагч';

  // UI-ийн ₮ дүнг шууд cents болгож илгээж байна — test sandbox-д USD-р цэнэглэгдэнэ.
  // Тайлбар нь payment.adapter.ts дотор бичигдсэн.
  const amountMinor = params.body.amount;

  const pi = await payments.createPaymentIntent({
    amountMinor,
    currency: PAYMENT_CURRENCY,
    description: `Donation to "${post.title}"`,
    metadata: {
      postId: params.postId,
      donorId: params.donor.id,
      paymentMethod: params.body.paymentMethod,
    },
  });

  const { txId } = await repo.createPendingDonationTransaction({
    postId: params.postId,
    donorId: params.donor.id,
    donorDisplayName: displayName,
    amount: params.body.amount,
    paymentMethod: params.body.paymentMethod,
    stripePaymentIntentId: pi.id,
  });

  return {
    clientSecret: pi.clientSecret,
    transactionId: txId,
    amountMinor,
    currency: PAYMENT_CURRENCY,
  };
}

/**
 * Stripe webhook-ээс ирсэн event-ийг боловсруулна. payment_intent.succeeded
 * үед гүйлгээг succeeded болгож цугларсан дүнг нэмнэ. payment_intent.payment_failed
 * үед гүйлгээг failed гэж тэмдэглэнэ. Бусад event-ийг логлоод үл хэрэгснэ.
 *
 * Энэ функц нь idempotent — ижил event-ийг хэд хэдэн удаа ирүүлсэн ч давтан
 * шинэчлэхгүй (`stripe_event_id` UNIQUE-ээр хамгаалагдсан).
 */
export async function handleStripeEvent(event: StripeEvent): Promise<{ handled: boolean }> {
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as { id: string };
    const result = await repo.finalizeDonationByPaymentIntent({
      paymentIntentId: pi.id,
      eventId: event.id,
    });
    if (result.bumped) {
      logger.info(
        { paymentIntentId: pi.id, postId: result.postId, amount: result.amount },
        'donations.payment_succeeded',
      );
      const ctx = await repo.findDonationNotifyContextByPaymentIntent(pi.id);
      if (ctx) {
        const donorLabel = ctx.donorDisplayName.trim() || 'Хандивлагч';
        await notificationsService.notifySafe({
          userId: ctx.ownerId,
          type: 'donation_received',
          title: 'Шинэ хандив',
          body: `${donorLabel} таны «${ctx.postTitle}» зарт ${ctx.amount.toLocaleString('mn-MN')} төгрөгөөр хандив өглөө.`,
          actionLabel: 'Харах',
          actionUrl: `/donations/${ctx.postId}`,
          sourceId: `donation_tx:${pi.id}`,
        });
        if (ctx.status === 'completed') {
          await notificationsService.notifySafe({
            userId: ctx.ownerId,
            type: 'donation_goal_reached',
            title: 'Хандивын зорилт биеллээ',
            body: `«${ctx.postTitle}» зорилтот дүн ${ctx.goalAmount.toLocaleString('mn-MN')} төгрөгөөр биеллээ.`,
            actionLabel: 'Харах',
            actionUrl: `/donations/${ctx.postId}`,
            sourceId: `donation_goal:${ctx.postId}`,
          });
        }
      }
    }
    return { handled: true };
  }
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as { id: string };
    await repo.markDonationFailedByPaymentIntent({
      paymentIntentId: pi.id,
      eventId: event.id,
    });
    logger.info({ paymentIntentId: pi.id }, 'donations.payment_failed');
    return { handled: true };
  }
  logger.debug({ eventType: event.type }, 'donations.webhook_ignored');
  return { handled: false };
}

export async function updateDonationPost(params: {
  id: string;
  user: { id: string; role: string };
  body: UpdateBody;
}) {
  const ownerId = await repo.findDonationPostOwnerId(params.id);
  if (!ownerId) {
    throw new NotFoundError('Хандивын зар олдсонгүй', 'DONATION_POST_NOT_FOUND');
  }
  if (ownerId !== params.user.id && params.user.role !== 'admin') {
    throw new ForbiddenError('Та энэ зарыг засах эрхгүй байна.', 'DONATION_POST_EDIT_FORBIDDEN');
  }

  const b = params.body;
  const updated = await repo.updateDonationPost({
    id: params.id,
    ownerId,
    title: b.title.trim(),
    description: b.description.trim(),
    goalAmount: b.goalAmount,
    status: b.status,
    photoPublicId: normalisePhoto(b.photoPublicId ?? null),
  });
  if (!updated) {
    throw new NotFoundError('Хандивын зар олдсонгүй', 'DONATION_POST_NOT_FOUND');
  }
  await invalidateDonationsListCache();
  return updated;
}
