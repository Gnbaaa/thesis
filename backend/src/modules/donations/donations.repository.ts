import type { DateRangeFilter } from '../../shared/dateRangeSql';
import { appendDateRange } from '../../shared/dateRangeSql';
import { getPool } from '../../infra/db/pool';
import { getImageUrl } from '../../shared/storage';
import type {
  CreateDonationPostInput,
  DonationPostDetail,
  DonationPostListItem,
  DonationPostListQuery,
  DonationPostStatus,
  DonationTransactionPublic,
  OwnerDonationActivityReport,
  OwnerDonationActivityTransaction,
  UpdateDonationPostInput,
} from './donations.types';

type ListRow = {
  id: string;
  title: string;
  description: string;
  goal_amount: string;
  collected_amount: string;
  status: string;
  photo_public_id: string | null;
  created_at: string;
};

type DetailRow = ListRow & {
  updated_at: string;
  owner_id: string;
  owner_email: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_role: string;
  owner_avatar_url: string | null;
  owner_avatar_public_id: string | null;
};

function normaliseStatus(raw: string): DonationPostStatus {
  return raw === 'completed' ? 'completed' : 'active';
}

function safePhotoUrl(publicId: string | null, width: number): string | null {
  if (!publicId) return null;
  try {
    return getImageUrl(publicId, { width });
  } catch {
    return null;
  }
}

function mapListRow(r: ListRow): DonationPostListItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    goalAmount: Number(r.goal_amount),
    collectedAmount: Number(r.collected_amount),
    status: normaliseStatus(r.status),
    photoUrl: safePhotoUrl(r.photo_public_id, 800),
    createdAt: r.created_at,
  };
}

function ownerDisplayName(r: DetailRow): string {
  const full = `${r.owner_first_name ?? ''} ${r.owner_last_name ?? ''}`.trim();
  return full || r.owner_email;
}

function mapDetailRow(
  r: DetailRow,
  donorCount: number,
  recentTransactions: DonationTransactionPublic[],
): DonationPostDetail {
  return {
    ...mapListRow(r),
    photoUrl: safePhotoUrl(r.photo_public_id, 1200),
    updatedAt: r.updated_at,
    owner: {
      id: r.owner_id,
      displayName: ownerDisplayName(r),
      avatarUrl:
        safePhotoUrl(r.owner_avatar_public_id, 128) ?? r.owner_avatar_url ?? null,
      role: r.owner_role,
    },
    donorCount,
    recentTransactions,
  };
}

export async function listDonationPosts(
  query: DonationPostListQuery,
): Promise<{ items: DonationPostListItem[]; total: number }> {
  const pool = getPool();
  const where: string[] = [];
  const values: Array<string | number> = [];

  const q = query.q?.trim();
  if (q) {
    values.push(`%${q}%`);
    where.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }

  if (query.status) {
    values.push(query.status);
    where.push(`status = $${values.length}`);
  }

  if (typeof query.lastDays === 'number') {
    values.push(query.lastDays);
    where.push(`created_at >= NOW() - ($${values.length}::int * INTERVAL '1 day')`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (query.page - 1) * query.pageSize;

  const countRes = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text as total FROM donation_posts ${whereSql}`,
    values,
  );
  const total = Number(countRes.rows[0]?.total ?? 0);

  const listRes = await pool.query<ListRow>(
    `
    SELECT
      id,
      title,
      description,
      goal_amount::text AS goal_amount,
      collected_amount::text AS collected_amount,
      status,
      photo_public_id,
      created_at::text AS created_at
    FROM donation_posts
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
    `,
    [...values, query.pageSize, offset],
  );

  return { items: listRes.rows.map(mapListRow), total };
}

export async function findDonationPostById(id: string): Promise<DonationPostDetail | null> {
  const pool = getPool();
  const { rows } = await pool.query<DetailRow>(
    `
    SELECT
      p.id,
      p.title,
      p.description,
      p.goal_amount::text AS goal_amount,
      p.collected_amount::text AS collected_amount,
      p.status,
      p.photo_public_id,
      p.created_at::text AS created_at,
      p.updated_at::text AS updated_at,
      u.id AS owner_id,
      u.email AS owner_email,
      u.first_name AS owner_first_name,
      u.last_name AS owner_last_name,
      u.role AS owner_role,
      u.avatar_url AS owner_avatar_url,
      u.avatar_public_id AS owner_avatar_public_id
    FROM donation_posts p
    JOIN users u ON u.id = p.owner_id
    WHERE p.id = $1
    LIMIT 1
    `,
    [id],
  );
  const row = rows[0];
  if (!row) return null;

  const countRes = await pool.query<{ donor_count: string }>(
    `
    SELECT COUNT(DISTINCT COALESCE(donor_id::text, id::text))::text AS donor_count
    FROM donation_transactions
    WHERE post_id = $1 AND status = 'succeeded'
    `,
    [id],
  );
  const donorCount = Number(countRes.rows[0]?.donor_count ?? 0);

  const recentRes = await pool.query<{
    id: string;
    donor_display_name: string;
    amount: string;
    created_at: string;
  }>(
    `
    SELECT id, donor_display_name, amount::text AS amount, created_at::text AS created_at
    FROM donation_transactions
    WHERE post_id = $1 AND status = 'succeeded'
    ORDER BY created_at DESC
    LIMIT 5
    `,
    [id],
  );
  const recentTransactions: DonationTransactionPublic[] = recentRes.rows.map((r) => ({
    id: r.id,
    donorDisplayName: r.donor_display_name,
    amount: Number(r.amount),
    createdAt: r.created_at,
  }));

  return mapDetailRow(row, donorCount, recentTransactions);
}

export async function findUserDisplayName(userId: string): Promise<string | null> {
  const { rows } = await getPool().query<{
    email: string;
    first_name: string | null;
    last_name: string | null;
  }>(`SELECT email, first_name, last_name FROM users WHERE id = $1 LIMIT 1`, [userId]);
  const r = rows[0];
  if (!r) return null;
  const name = `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim();
  return name || r.email;
}

export async function findDonationPostOwnerId(id: string): Promise<string | null> {
  const { rows } = await getPool().query<{ owner_id: string }>(
    `SELECT owner_id FROM donation_posts WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0]?.owner_id ?? null;
}

export async function createDonationPost(input: CreateDonationPostInput): Promise<{ id: string }> {
  const { rows } = await getPool().query<{ id: string }>(
    `
    INSERT INTO donation_posts (
      owner_id,
      title,
      description,
      goal_amount,
      status,
      photo_public_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
    `,
    [
      input.ownerId,
      input.title,
      input.description,
      input.goalAmount,
      input.status,
      input.photoPublicId,
    ],
  );
  return { id: rows[0]!.id };
}

/**
 * Хандивын гүйлгээг `pending` статустайгаар үүсгэх (Stripe PaymentIntent-ийн id-тэй).
 * `succeeded` болгох ажил нь Stripe webhook ирмэгц хийгдэнэ — гэрээний дагуу
 * webhook event нь тулгуур үнэн (NFR-S, FR-9).
 */
export async function createPendingDonationTransaction(input: {
  postId: string;
  donorId: string;
  donorDisplayName: string;
  amount: number;
  paymentMethod: string;
  stripePaymentIntentId: string;
}): Promise<{ txId: string }> {
  const { rows } = await getPool().query<{ id: string }>(
    `
    INSERT INTO donation_transactions (
      post_id, donor_id, donor_display_name, amount, payment_method, status, stripe_payment_intent_id
    ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
    RETURNING id
    `,
    [
      input.postId,
      input.donorId,
      input.donorDisplayName,
      input.amount,
      input.paymentMethod,
      input.stripePaymentIntentId,
    ],
  );
  return { txId: rows[0]!.id };
}

/**
 * Stripe webhook (`payment_intent.succeeded`) ирэхэд гүйлгээг succeeded болгож,
 * `donation_posts.collected_amount`-ыг нэг атомын транзакц дотор шинэчилнэ.
 *
 * Idempotency: ижил `eventId`-аар дахин дуудагдвал юу ч хийхгүй буцна
 * (`stripe_event_id` дээр UNIQUE index ажиллана). Мөн pending гүйлгээг л
 * succeeded болгож байгаа тул дахин хийх боломжгүй.
 *
 * @returns `bumped` нь энэ дуудалт цугларсан дүнг шинэчилсэн эсэхийг заана.
 */
export async function finalizeDonationByPaymentIntent(params: {
  paymentIntentId: string;
  eventId: string;
}): Promise<{ bumped: boolean; postId: string | null; amount: number }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateRes = await client.query<{ id: string; post_id: string; amount: string }>(
      `
      UPDATE donation_transactions
      SET status = 'succeeded', stripe_event_id = $2
      WHERE stripe_payment_intent_id = $1 AND status = 'pending' AND stripe_event_id IS NULL
      RETURNING id, post_id, amount::text AS amount
      `,
      [params.paymentIntentId, params.eventId],
    );
    const updated = updateRes.rows[0];
    if (!updated) {
      await client.query('COMMIT');
      return { bumped: false, postId: null, amount: 0 };
    }
    const amount = Number(updated.amount);
    await client.query(
      `
      UPDATE donation_posts
      SET
        collected_amount = collected_amount + $2,
        status = CASE
          WHEN collected_amount + $2 >= goal_amount THEN 'completed'
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = $1
      `,
      [updated.post_id, amount],
    );
    await client.query('COMMIT');
    return { bumped: true, postId: updated.post_id, amount };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Stripe webhook (`payment_intent.payment_failed`) ирэхэд pending гүйлгээг
 * failed болгоно.
 */
export async function markDonationFailedByPaymentIntent(params: {
  paymentIntentId: string;
  eventId: string;
}): Promise<{ updated: boolean }> {
  const { rowCount } = await getPool().query(
    `
    UPDATE donation_transactions
    SET status = 'failed', stripe_event_id = $2
    WHERE stripe_payment_intent_id = $1 AND status = 'pending' AND stripe_event_id IS NULL
    `,
    [params.paymentIntentId, params.eventId],
  );
  return { updated: (rowCount ?? 0) > 0 };
}

export type DonationNotifyContext = {
  ownerId: string;
  postId: string;
  postTitle: string;
  donorDisplayName: string;
  amount: number;
  collectedAmount: number;
  goalAmount: number;
  status: string;
};

/** Амжилттай төлбөрийн дараа мэдэгдэл илгээхэд шаардлагатай контекст. */
export async function findDonationNotifyContextByPaymentIntent(
  paymentIntentId: string,
): Promise<DonationNotifyContext | null> {
  const { rows } = await getPool().query<{
    owner_id: string;
    post_id: string;
    post_title: string;
    donor_display_name: string;
    amount: string;
    collected_amount: string;
    goal_amount: string;
    status: string;
  }>(
    `
    SELECT
      dp.owner_id,
      dp.id AS post_id,
      dp.title AS post_title,
      dt.donor_display_name,
      dt.amount::text AS amount,
      dp.collected_amount::text AS collected_amount,
      dp.goal_amount::text AS goal_amount,
      dp.status
    FROM donation_transactions dt
    JOIN donation_posts dp ON dp.id = dt.post_id
    WHERE dt.stripe_payment_intent_id = $1 AND dt.status = 'succeeded'
    LIMIT 1
    `,
    [paymentIntentId],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    ownerId: r.owner_id,
    postId: r.post_id,
    postTitle: r.post_title,
    donorDisplayName: r.donor_display_name,
    amount: Number(r.amount),
    collectedAmount: Number(r.collected_amount),
    goalAmount: Number(r.goal_amount),
    status: r.status,
  };
}

/**
 * NGO/хэрэглэгчийн өөрийн зарт ирсэн хандивын идэвхийн тайлан. Зөвхөн
 * `donation_posts.owner_id = $1` тохирох зарууд дээрх гүйлгээг харна.
 */
export async function getOwnerDonationActivityReport(
  ownerId: string,
  options?: { transactionsLimit?: number; range?: DateRangeFilter },
): Promise<OwnerDonationActivityReport> {
  const pool = getPool();
  const limit = Math.min(Math.max(options?.transactionsLimit ?? 50, 1), 200);
  const range = options?.range;

  const statsValues: unknown[] = [ownerId];
  const statsRangeSql = appendDateRange('t.created_at', range, statsValues);

  const statsRes = await pool.query<{
    total_collected: string | null;
    success_count: string | null;
    last7_count: string | null;
  }>(
    `
    SELECT
      COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'succeeded'), 0)::text AS total_collected,
      COALESCE(COUNT(*) FILTER (WHERE t.status = 'succeeded'), 0)::text AS success_count,
      COALESCE(COUNT(*) FILTER (WHERE t.status = 'succeeded' AND t.created_at >= NOW() - INTERVAL '7 days'), 0)::text AS last7_count
    FROM donation_transactions t
    INNER JOIN donation_posts p ON p.id = t.post_id
    WHERE p.owner_id = $1${statsRangeSql}
    `,
    statsValues,
  );
  const s = statsRes.rows[0]!;

  const txValues: unknown[] = [ownerId];
  const txRangeSql = appendDateRange('t.created_at', range, txValues);
  txValues.push(limit);

  const txRes = await pool.query<{
    id: string;
    created_at: string;
    amount: string;
    status: string;
    payment_method: string;
    donor_display_name: string;
    post_id: string;
    post_title: string;
    stripe_payment_intent_id: string | null;
  }>(
    `
    SELECT
      t.id, t.created_at, t.amount::text AS amount, t.status, t.payment_method,
      t.donor_display_name, t.post_id, p.title AS post_title,
      t.stripe_payment_intent_id
    FROM donation_transactions t
    INNER JOIN donation_posts p ON p.id = t.post_id
    WHERE p.owner_id = $1${txRangeSql}
    ORDER BY t.created_at DESC
    LIMIT $${txValues.length}
    `,
    txValues,
  );

  const transactions: OwnerDonationActivityTransaction[] = txRes.rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    amount: Number(r.amount),
    status: r.status === 'succeeded' ? 'succeeded' : r.status === 'failed' ? 'failed' : 'pending',
    paymentMethod: r.payment_method,
    donorDisplayName: r.donor_display_name,
    postId: r.post_id,
    postTitle: r.post_title,
    stripePaymentIntentId: r.stripe_payment_intent_id,
  }));

  return {
    totalCollected: Number(s.total_collected ?? 0),
    successCount: Number(s.success_count ?? 0),
    last7DaysCount: Number(s.last7_count ?? 0),
    transactions,
  };
}

export async function updateDonationPost(
  input: UpdateDonationPostInput,
): Promise<{ id: string } | null> {
  const { rows } = await getPool().query<{ id: string }>(
    `
    UPDATE donation_posts
    SET
      title = $3,
      description = $4,
      goal_amount = $5,
      status = $6,
      photo_public_id = $7,
      updated_at = NOW()
    WHERE id = $1 AND owner_id = $2
    RETURNING id
    `,
    [
      input.id,
      input.ownerId,
      input.title,
      input.description,
      input.goalAmount,
      input.status,
      input.photoPublicId,
    ],
  );
  const row = rows[0];
  return row ? { id: row.id } : null;
}
