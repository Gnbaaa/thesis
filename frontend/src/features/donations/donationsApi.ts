import { api } from '@/lib/api';

export type DonationPostStatus = 'active' | 'completed';
export type DonationDateRange = 'last7days' | 'last30days';

export type DonationPostListItem = {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  collectedAmount: number;
  status: DonationPostStatus;
  photoUrl: string | null;
  createdAt: string;
};

export type DonationPostOwnerPublic = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

export type DonationPaymentMethod = 'card' | 'bank' | 'qpay';

export type DonationTransactionPublic = {
  id: string;
  donorDisplayName: string;
  amount: number;
  createdAt: string;
};

export type DonationPostDetail = DonationPostListItem & {
  owner: DonationPostOwnerPublic;
  updatedAt: string;
  donorCount: number;
  recentTransactions: DonationTransactionPublic[];
};

export type DonationPostListResponse = {
  items: DonationPostListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ListDonationPostsParams = {
  q?: string;
  status?: DonationPostStatus | 'all';
  range?: DonationDateRange | 'all';
  page?: number;
  pageSize?: number;
};

const RANGE_TO_DAYS: Record<DonationDateRange, number> = {
  last7days: 7,
  last30days: 30,
};

export async function listDonationPosts(
  params: ListDonationPostsParams,
): Promise<DonationPostListResponse> {
  const lastDays =
    params.range && params.range !== 'all' ? RANGE_TO_DAYS[params.range] : undefined;
  const { data } = await api.get<DonationPostListResponse>('/api/v1/donations', {
    params: {
      q: params.q?.trim() ? params.q.trim() : undefined,
      status: params.status && params.status !== 'all' ? params.status : undefined,
      lastDays,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 8,
    },
  });
  return data;
}

export async function getDonationPost(id: string): Promise<DonationPostDetail> {
  const { data } = await api.get<DonationPostDetail>(
    `/api/v1/donations/${encodeURIComponent(id)}`,
  );
  return data;
}

export type CreateDonationPostRequest = {
  title: string;
  description: string;
  goalAmount: number;
  status?: DonationPostStatus;
  photoPublicId?: string | null;
};

export async function createDonationPost(
  body: CreateDonationPostRequest,
): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>('/api/v1/donations', body);
  return data;
}

export async function updateDonationPost(
  id: string,
  body: CreateDonationPostRequest,
): Promise<{ id: string }> {
  const { data } = await api.patch<{ id: string }>(
    `/api/v1/donations/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export type DonateRequest = {
  amount: number;
  paymentMethod: DonationPaymentMethod;
};

export type InitiateDonationResult = {
  /** Stripe Elements-ийн `confirmPayment`-д өгөх client_secret. */
  clientSecret: string;
  /** Backend дэх pending гүйлгээний UUID. */
  transactionId: string;
  /** Stripe-руу илгээгдэх дүн жижиг нэгжээр. */
  amountMinor: number;
  /** ISO 4217 валют. */
  currency: string;
};

/**
 * Хандив өгөх процессыг эхлүүлнэ — backend нь Stripe PaymentIntent үүсгэж
 * `clientSecret`-ийг буцаана. Frontend дараа нь Stripe Elements ашиглан
 * төлбөрийг баталгаажуулна. Цугларсан дүн нь Stripe webhook ирмэгц л шинэчлэгдэнэ.
 */
export async function donateToPost(
  id: string,
  body: DonateRequest,
): Promise<InitiateDonationResult> {
  const { data } = await api.post<InitiateDonationResult>(
    `/api/v1/donations/${encodeURIComponent(id)}/donate`,
    body,
  );
  return data;
}

export type UploadImageResponse = {
  publicId: string;
  url: string;
  bytes: number;
  width?: number;
  height?: number;
};

export async function uploadDonationImage(file: File): Promise<UploadImageResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', 'donations');
  const { data } = await api.post<UploadImageResponse>('/api/v1/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
