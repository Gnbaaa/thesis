import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { loadStripe, type Stripe, type StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {
  donateToPost,
  getDonationPost,
  type DonationPostDetail,
  type DonationTransactionPublic,
} from '@/features/donations/donationsApi';
import { DonationStatusBadge } from '@/features/donations/donationStatusBadge';
import { donationStatusLabel } from '@/features/donations/donationStatusLabel';
import { CenteredPage } from '@/components/layout/CenteredPage';
import { getAuthUserId, useIsLoggedIn } from '@/lib/authSession';
import { cn } from '@/lib/cn';
import { btnPrimary, btnSecondary, focusRing } from '@/lib/uiClasses';

const amountFormatter = new Intl.NumberFormat('en-US');
function formatMnt(value: number): string {
  return `${amountFormatter.format(Math.max(0, Math.round(value)))}₮`;
}

function percent(collected: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((collected / goal) * 100)));
}

function formatDateYYYYMMDD(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10).replace(/-/g, '.');
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function timeAgo(value: string, t: (k: string, opts?: { count: number }) => string): string {
  const d = new Date(value).getTime();
  if (!Number.isFinite(d)) return '';
  const diffMs = Date.now() - d;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return t('donations.detail.ago.now');
  if (minutes < 60) return t('donations.detail.ago.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('donations.detail.ago.hours', { count: hours });
  const days = Math.floor(hours / 24);
  return t('donations.detail.ago.days', { count: days });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];
const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 10_000_000;
const DEFAULT_AMOUNT = 5000;

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s,]/g, '').trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise: Promise<Stripe | null> | null = publishableKey
  ? loadStripe(publishableKey)
  : null;

export default function DonationsDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const loggedIn = useIsLoggedIn();
  const myId = getAuthUserId();

  const postId = typeof id === 'string' ? id : '';
  const detailKey = ['donations', 'detail', postId] as const;

  const query = useQuery({
    queryKey: detailKey,
    queryFn: () => getDonationPost(postId),
    enabled: Boolean(postId),
  });

  const data = query.data;
  const isOwner = Boolean(data?.owner.id && myId && data.owner.id === myId);

  const pct = useMemo(() => {
    if (!data) return 0;
    return percent(data.collectedAmount, data.goalAmount);
  }, [data]);

  // Initial Elements options. Stripe Elements нь анхдагч `options.amount`-ыг
  // mount хийх үед барина — дараа нь хэрэглэгч өөрчилбөл `elements.update()`-ээр
  // шинэчилнэ (DonationForm дотор).
  const elementsOptions = useMemo<StripeElementsOptions>(
    () => ({
      mode: 'payment',
      amount: DEFAULT_AMOUNT,
      currency: 'usd',
      appearance: { theme: 'stripe' },
    }),
    [],
  );

  if (query.isLoading) {
    return (
      <CenteredPage maxWidth="2xl">
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </CenteredPage>
    );
  }

  if (query.isError || !data) {
    return (
      <CenteredPage maxWidth="2xl">
        <button
          type="button"
          className={cn(btnSecondary, focusRing, 'h-10 w-auto px-4')}
          onClick={() => navigate('/donations')}
        >
          {t('donations.detail.back')}
        </button>
        <p className="mt-4 rounded-card border border-border-card bg-surface-card px-4 py-3 text-sm text-text-muted">
          {t('donations.detail.loadFailed')}
        </p>
      </CenteredPage>
    );
  }

  const isClosed = data.status !== 'active';
  const showDonateForm = !isOwner && !isClosed;
  const canRenderStripe = Boolean(stripePromise);

  return (
    <CenteredPage maxWidth="2xl">
      <Link
        to="/donations"
        className={cn(
          'inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover',
          focusRing,
          'rounded-input no-underline hover:no-underline',
        )}
      >
        {t('donations.detail.back')}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
        <div className="min-w-0">
          <div className="flex h-[280px] w-full items-center justify-center overflow-hidden rounded-card border border-border-card bg-surface-card sm:h-[320px]">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-sm text-text-muted">{t('donations.detail.imagePlaceholder')}</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="flex-1 font-serif text-2xl font-semibold leading-tight tracking-tight text-text-heading sm:text-[26px]">
              {data.title}
            </h1>
            <DonationStatusBadge status={data.status} t={t} />
          </div>

          <div className="mt-6">
            <h2 className="text-[15px] font-semibold text-text-heading">
              {t('donations.detail.descriptionLabel')}
            </h2>
            <div className="mt-2.5 rounded-[10px] border border-border-card bg-surface-card px-6 py-5 text-[14px] leading-[1.6] text-text-secondary">
              {data.description?.trim()
                ? data.description
                : t('donations.detail.noDescription')}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-[15px] font-semibold text-text-heading">
              {t('donations.detail.organizer')}
            </h2>
            <div className="mt-2.5 flex items-center gap-3.5 rounded-[10px] border border-border-card bg-surface-card px-6 py-4">
              <div className="size-11 overflow-hidden rounded-full border border-border-card bg-surface-muted">
                {data.owner.avatarUrl ? (
                  <img
                    src={data.owner.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">
                  {data.owner.displayName}
                </p>
                <p className="text-xs text-text-muted">
                  {data.owner.role === 'ngo'
                    ? t('donations.detail.organizerNgo')
                    : t('donations.detail.organizerUser')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-[12px] border border-border-card bg-surface-card px-7 py-6">
            <h2 className="text-[15px] font-semibold text-text-heading">
              {t('donations.detail.progressTitle')}
            </h2>
            <div className="mt-5 text-center">
              <p className="text-[30px] font-bold text-text-heading">
                {formatMnt(data.collectedAmount)}
              </p>
              <p className="mt-1 text-[13px] text-text-muted">
                {t('donations.detail.goalOf', { amount: formatMnt(data.goalAmount) })}
              </p>
            </div>
            <div
              className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-[width]',
                  data.status === 'completed' || pct >= 100
                    ? 'bg-emerald-500'
                    : 'bg-text-heading',
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-[13px] text-text-muted">
              {pct}% {t('donations.detail.collectedSuffix')}
            </p>
            <div className="mt-5 border-t border-border-card pt-4" />
            <div className="flex flex-col gap-2.5 pt-1">
              <InfoRow
                label={t('donations.detail.fields.status')}
                value={donationStatusLabel(data.status, t)}
              />
              <InfoRow
                label={t('donations.detail.fields.publishedAt')}
                value={formatDateYYYYMMDD(data.createdAt)}
              />
              <InfoRow
                label={t('donations.detail.fields.donorCount')}
                value={`${data.donorCount} ${t('donations.detail.unit')}`}
              />
            </div>
          </div>

          {showDonateForm && canRenderStripe ? (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <DonationForm
                postId={postId}
                loggedIn={loggedIn}
                onLoginRequired={() => navigate('/login')}
                onSuccess={(next) => {
                  if (next) {
                    queryClient.setQueryData<DonationPostDetail>(detailKey, next);
                  } else {
                    queryClient.invalidateQueries({ queryKey: detailKey });
                  }
                }}
              />
            </Elements>
          ) : null}

          {showDonateForm && !canRenderStripe ? (
            <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-5 py-4 text-[13px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              {t('donations.detail.stripeUnavailable')}
            </div>
          ) : null}

          {isOwner ? (
            <div className="rounded-[10px] border border-border-card bg-surface-card px-5 py-4 text-[13px] text-text-muted">
              {t('donations.detail.noteSelfOwner')}
            </div>
          ) : null}
          {!isOwner && isClosed ? (
            <div className="rounded-[10px] border border-border-card bg-surface-card px-5 py-4 text-[13px] text-text-muted">
              {t('donations.detail.noteCompleted')}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[12px] border border-border-card bg-surface-card">
            <div className="px-6 pb-3.5 pt-5">
              <h2 className="text-[15px] font-semibold text-text-heading">
                {t('donations.detail.recentTitle')}
              </h2>
            </div>
            <div className="h-px w-full bg-border-card" />
            {data.recentTransactions.length === 0 ? (
              <p className="px-6 py-5 text-[13px] text-text-muted">
                {t('donations.detail.recentEmpty')}
              </p>
            ) : (
              data.recentTransactions.map((tx: DonationTransactionPublic) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 border-b border-border-card px-6 py-3.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-text">
                      {tx.donorDisplayName}
                    </p>
                    <p className="text-[11px] text-text-muted">{timeAgo(tx.createdAt, t)}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-text">
                    {formatMnt(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </CenteredPage>
  );
}

type DonationFormProps = {
  postId: string;
  loggedIn: boolean;
  onLoginRequired: () => void;
  onSuccess: (next: DonationPostDetail | null) => void;
};

function DonationForm({ postId, loggedIn, onLoginRequired, onSuccess }: DonationFormProps) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [amountInput, setAmountInput] = useState(String(DEFAULT_AMOUNT));
  const [amountError, setAmountError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amountValue = parseAmount(amountInput);
  const stripeAmount = amountValue && amountValue >= MIN_AMOUNT ? amountValue : DEFAULT_AMOUNT;

  useEffect(() => {
    if (!elements) return;
    elements.update({ amount: stripeAmount });
  }, [elements, stripeAmount]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAmountError(null);
    setStripeError(null);

    if (!loggedIn) {
      onLoginRequired();
      return;
    }

    if (amountValue === null) {
      setAmountError(t('donations.detail.errors.amountFormat'));
      return;
    }
    if (amountValue < MIN_AMOUNT) {
      setAmountError(t('donations.detail.errors.amountMin'));
      return;
    }
    if (amountValue > MAX_AMOUNT) {
      setAmountError(t('donations.detail.errors.amountMax'));
      return;
    }

    if (!stripe || !elements) {
      setStripeError(t('donations.detail.errors.submit'));
      return;
    }

    setSubmitting(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setStripeError(submitError.message ?? t('donations.detail.errors.submit'));
        return;
      }

      const init = await donateToPost(postId, {
        amount: amountValue,
        paymentMethod: 'card',
      });

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: init.clientSecret,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setStripeError(confirmError.message ?? t('donations.detail.errors.submit'));
        return;
      }

      if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
        // Webhook нь үнэн төлөвийг тогтооно. UI-ийг сэргээхийн тулд detail-ийг
        // дахин ачаална. Stripe webhook амжилттай боловсруулсны дараа
        // collected_amount шинэчлэгдсэн байна.
        onSuccess(null);
        setAmountInput(String(DEFAULT_AMOUNT));
      } else {
        setStripeError(t('donations.detail.errors.submit'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('donations.detail.errors.submit');
      setStripeError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-[12px] border border-border-card bg-surface-card px-7 py-6"
    >
      <h2 className="text-[15px] font-semibold text-text-heading">
        {t('donations.detail.formTitle')}
      </h2>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-text-secondary">
          {t('donations.detail.amount')}
        </span>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-text-muted">
            ₮
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={t('donations.detail.amountPh')}
            className={cn(
              'h-11 w-full rounded-lg border border-border-input bg-surface-card pl-8 pr-3 text-sm text-text placeholder:text-text-muted',
              focusRing,
            )}
          />
        </div>
        {amountError ? (
          <span className="text-xs text-danger-text">{amountError}</span>
        ) : null}
      </label>

      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setAmountInput(String(v));
              setAmountError(null);
            }}
            className={cn(
              'inline-flex h-8 items-center justify-center rounded-full border border-border-input bg-surface-muted px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover',
              focusRing,
            )}
          >
            {formatMnt(v)}
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-medium text-text-secondary">
          {t('donations.detail.cardSection')}
        </span>
        <div className="rounded-lg border border-border-input bg-surface-card px-3 py-3">
          <PaymentElement options={{ layout: 'tabs' }} />
        </div>
        <p className="text-[11px] text-text-muted">{t('donations.detail.testHint')}</p>
      </div>

      {stripeError ? (
        <p
          role="alert"
          className="rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          {stripeError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || !stripe || !elements}
        className={cn(
          btnPrimary,
          focusRing,
          'h-[50px] w-full rounded-[10px] text-[15px] font-semibold disabled:opacity-60',
        )}
      >
        {submitting
          ? t('donations.detail.submitting')
          : !loggedIn
            ? t('donations.detail.noteLogin')
            : t('donations.detail.submit')}
      </button>
    </form>
  );
}
