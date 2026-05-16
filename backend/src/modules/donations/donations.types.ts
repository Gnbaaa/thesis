export type DonationPostStatus = 'active' | 'completed';
export type DonationDateRange = 'last7days' | 'last30days';

export type DonationPostListItem = {
  id: string;
  title: string;
  description: string;
  /** Зорилтот дүн (MNT, бүхэл тоо). */
  goalAmount: number;
  /** Цугларсан дүн (MNT, бүхэл тоо). */
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

export type DonationTransactionStatus = 'pending' | 'succeeded' | 'failed';

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

export type OwnerDonationActivityTransaction = {
  id: string;
  createdAt: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  paymentMethod: string;
  donorDisplayName: string;
  postId: string;
  postTitle: string;
  stripePaymentIntentId: string | null;
};

export type OwnerDonationActivityReport = {
  /** Эзэмшигчийн зарт ирсэн нийт амжилттай хандивын дүн. */
  totalCollected: number;
  /** Амжилттай гүйлгээний нийт тоо. */
  successCount: number;
  /** Сүүлийн 7 хоногт амжилттай гарсан хандивын тоо. */
  last7DaysCount: number;
  /** Сүүлийн N гүйлгээ (бүх статус) — хүснэгтэд харуулна. */
  transactions: OwnerDonationActivityTransaction[];
};

export type InitiateDonationResult = {
  /** Frontend ашиглан Stripe Elements-ээр төлбөр баталгаажуулах client_secret. */
  clientSecret: string;
  /** Үүсгэсэн pending гүйлгээний UUID. */
  transactionId: string;
  /** Жижиг нэгжийн дүн (cents) — нийт цэнэглэгдэх сумм. */
  amountMinor: number;
  /** ISO 4217 валют. */
  currency: string;
};

export type DonationPostListQuery = {
  q?: string;
  status?: DonationPostStatus;
  lastDays?: number;
  page: number;
  pageSize: number;
};

export type CreateDonationPostInput = {
  ownerId: string;
  title: string;
  description: string;
  goalAmount: number;
  status: DonationPostStatus;
  photoPublicId: string | null;
};

export type UpdateDonationPostInput = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  goalAmount: number;
  status: DonationPostStatus;
  photoPublicId: string | null;
};
