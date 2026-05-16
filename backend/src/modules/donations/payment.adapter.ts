/**
 * Stripe payment adapter.
 *
 * Энэхүү адаптер нь Stripe SDK-г бизнес логикоос тусгаарласан нимгэн давхарга.
 * NFR-M1-ийн дагуу бусад код Stripe-ийн SDK-руу шууд хандахгүй — зөвхөн доорх
 * экспортыг ашиглана. Stripe-ийг өөр payment provider-аар солих шаардлага
 * гарвал зөвхөн энэ файлыг сольж болно.
 *
 * Test mode тэмдэглэл:
 * - Stripe нь MNT валютыг дэмждэггүй тул test sandbox-д `usd` валют ашиглана.
 * - UI-д харагдах ₮ дүнг шууд cents (minor unit) болгон илгээж байгаа учир
 *   жишээ нь 5,000₮ оруулбал Stripe дээр $50.00 USD цэнэглэгдэнэ. Энэ нь
 *   demo/diploma зорилгоор хийгдсэн; production-д жинхэнэ валют солилт эсвэл
 *   MNT-дэмждэг payment processor хэрэгтэй.
 */
import Stripe from 'stripe';
import { AppError } from '../../shared/errors';

// stripe v22 cjs typings нь `Stripe.Event` гэх мэт namespace member-ийг
// шууд гаргадаггүй тул instance type-аас деривацлагдсан type alias ашиглана.
type StripeApi = InstanceType<typeof Stripe>;
export type StripeEvent = ReturnType<StripeApi['webhooks']['constructEvent']>;

let cached: StripeApi | null = null;

function getStripe(): StripeApi {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new AppError(
      503,
      'STRIPE_NOT_CONFIGURED',
      'Stripe тохиргоо хийгдээгүй байна. STRIPE_SECRET_KEY оруулна уу.',
    );
  }
  if (!key.startsWith('sk_test_') && process.env.NODE_ENV !== 'production') {
    console.warn('[stripe] STRIPE_SECRET_KEY-нь sk_test_ форматтай биш байна.');
  }
  cached = new Stripe(key);
  return cached;
}

export function stripeIsConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type CreatePaymentIntentInput = {
  /** Дүн жижиг нэгжээр (cents). USD-д 5000 = $50.00. */
  amountMinor: number;
  /** ISO 4217. Default 'usd' (test sandbox). */
  currency?: string;
  /** Stripe Dashboard / webhook-д харагдах метадата. */
  metadata?: Record<string, string>;
  /** Stripe-д харагдах товч тайлбар. */
  description?: string;
};

export type CreatePaymentIntentResult = {
  id: string;
  clientSecret: string;
};

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentResult> {
  const stripe = getStripe();
  const pi = await stripe.paymentIntents.create({
    amount: Math.max(50, Math.floor(input.amountMinor)),
    currency: input.currency ?? 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: input.metadata,
    description: input.description,
  });
  if (!pi.client_secret) {
    throw new AppError(502, 'STRIPE_NO_CLIENT_SECRET', 'Stripe-ээс client_secret ирсэнгүй.');
  }
  return { id: pi.id, clientSecret: pi.client_secret };
}

/**
 * Stripe webhook payload-ийн жинхэнэ эсэхийг гарын үсгээр баталгаажуулна.
 * Алдаатай гарын үсэгтэй хүсэлтийг үргэлж шууд татгалзах ёстой (NFR-S, FR-9).
 */
export function verifyWebhook(rawBody: Buffer | string, signature: string | undefined): StripeEvent {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError(
      503,
      'STRIPE_WEBHOOK_NOT_CONFIGURED',
      'STRIPE_WEBHOOK_SECRET тохируулагдаагүй байна.',
    );
  }
  if (!signature) {
    throw new AppError(400, 'STRIPE_WEBHOOK_SIGNATURE_MISSING', 'Stripe гарын үсэг алга байна.');
  }
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new AppError(400, 'STRIPE_WEBHOOK_INVALID_SIGNATURE', `Stripe webhook гарын үсэг буруу: ${message}`);
  }
}
