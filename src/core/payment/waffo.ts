import * as crypto from 'crypto';

import {
  PaymentEventType,
  PaymentInterval,
  PaymentStatus,
  SubscriptionCycleType,
  SubscriptionStatus,
  WebhookIgnoredError,
  type CheckoutSession,
  type PaymentConfigs,
  type PaymentEvent,
  type PaymentOrder,
  type PaymentProvider,
  type PaymentSession,
  type SubscriptionInfo,
} from './types';

const WAFFO_API_URL = 'https://api.waffo.ai';
const WEBHOOK_TOLERANCE_MS = 45 * 60 * 1000;
const WEBHOOK_FUTURE_TOLERANCE_MS = 60 * 1000;

// These are Waffo's published webhook verification keys, matching the
// official @waffo/pancake-ts SDK. Dashboard overrides allow for key rotation.
const WAFFO_TEST_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxnmRY6yMMA3lVqmAU6ZG
b1sjL/+r/z6E+ZjkXaDAKiqOhk9rpazni0bNsGXwmftTPk9jy2wn+j6JHODD/WH/
SCnSfvKkLIjy4Hk7BuCgB174C0ydan7J+KgXLkOwgCAxxB68t2tezldwo74ZpXgn
F49opzMvQ9prEwIAWOE+kV9iK6gx/AckSMtHIHpUesoPDkldpmFHlB2qpf1vsFTZ
5kD6DmGl+2GIVK01aChy2lk8pLv0yUMu18v44sLkO5M44TkGPJD9qG09wrvVG2wp
OTVCn1n5pP8P+HRLcgzbUB3OlZVfdFurn6EZwtyL4ZD9kdkQ4EZE/9inKcp3c1h4
xwIDAQAB
-----END PUBLIC KEY-----`;
const WAFFO_PROD_WEBHOOK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz+xApdTIb4ua+DgZKQ54
iBsD82ybyhGCLRETONW4Jgbb3A8DUM1LqBk6r/CmTOCHqLalTQHNigvP3R5zkDNX
iRJz6gA4MJ/+8K0+mnEE2RISQzN+Qu65TNd6svb+INm/kMaftY4uIXr6y6kchtTJ
dwnQhcKdAL2v7h7IFnkVelQsKxDdb2PqX8xX/qwd01iXvMcpCCaXovUwZsxH2QN5
ZKBTseJivbhUeyJCco4fdUyxOMHe2ybCVhyvim2uxAl1nkvL5L8RCWMCAV55LLo0
9OhmLahz/DYNu13YLVP6dvIT09ZFBYU6Owj1NxdinTynlJCFS9VYwBgmftosSE1U
dwIDAQAB
-----END PUBLIC KEY-----`;

export interface WaffoConfigs extends PaymentConfigs {
  merchantId: string;
  privateKey: string;
  storeId?: string;
  environment?: 'test' | 'production';
  webhookTestPublicKey?: string;
  webhookProdPublicKey?: string;
}

interface WaffoEnvelope<T> {
  data?: T | null;
  errors?: Array<{ message?: string }>;
}

interface WaffoCheckoutResult {
  sessionId: string;
  checkoutUrl: string;
  expiresAt?: string;
}

interface WaffoPayment {
  id: string;
  orderId?: string;
  status?: string;
  createdAt?: string;
  orderMerchantExternalId?: string;
  snapshotAmountDetails?: {
    currency?: string;
    total?: string;
    subtotal?: string;
  };
  onetimeOrder?: {
    id: string;
    buyerEmail?: string;
    currency?: string;
    status?: string;
  };
  subscriptionOrder?: {
    id: string;
    buyerEmail?: string;
    currency?: string;
    status?: string;
    billingPeriod?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    canceledAt?: string;
  };
}

interface WaffoWebhookEvent {
  id?: string;
  timestamp?: string;
  eventType: string;
  eventId?: string;
  mode?: 'test' | 'prod';
  data: {
    orderId?: string;
    orderStatus?: string;
    orderMerchantExternalId?: string;
    buyerEmail?: string;
    merchantProvidedBuyerIdentity?: string;
    currency?: string;
    amount?: string;
    total?: string;
    paymentId?: string;
    paymentDate?: string;
    billingPeriod?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    canceledAt?: string;
    orderMetadata?: Record<string, unknown>;
    productName?: string;
    productDescription?: string;
    [key: string]: unknown;
  };
}

/**
 * Waffo Pancake hosted-checkout provider.
 *
 * Products and their prices are managed in Waffo. `getPaymentSession` looks
 * up state by our merchant order reference, which the payment service stores
 * as its provider lookup ID while retaining Waffo's real session ID in the
 * checkout result.
 */
export class WaffoProvider implements PaymentProvider {
  readonly name = 'waffo';
  configs: WaffoConfigs;

  constructor(configs: WaffoConfigs) {
    this.configs = configs;
  }

  async createPayment({
    order,
  }: {
    order: PaymentOrder;
  }): Promise<CheckoutSession> {
    if (!order.productId) throw new Error('Waffo productId is required');
    if (!order.price?.currency) throw new Error('Waffo currency is required');
    if (!order.orderNo) throw new Error('Waffo order number is required');

    const payload: Record<string, unknown> = {
      productId: order.productId,
      currency: order.price.currency.toUpperCase(),
      orderMerchantExternalId: order.orderNo,
      successUrl: order.successUrl,
      buyerEmail: order.customer?.email,
      metadata: {
        ...toStringRecord(order.metadata),
        shipanyOrderNo: order.orderNo,
      },
    };

    let checkoutResult: WaffoCheckoutResult;
    let checkoutUrl: string;
    const buyerIdentity = order.customer?.id || order.customer?.email;

    if (buyerIdentity) {
      const [tokenResult, sessionResult] = await Promise.all([
        this.signedPost<{ token: string }>(
          '/v1/actions/auth/issue-session-token',
          { productId: order.productId, buyerIdentity },
          { idempotencyWindow: 60 }
        ),
        this.signedPost<WaffoCheckoutResult>(
          '/v1/actions/checkout/create-session',
          payload,
          { idempotencyWindow: 60 }
        ),
      ]);
      checkoutResult = sessionResult;
      checkoutUrl = `${sessionResult.checkoutUrl}#token=${tokenResult.token}`;
    } else {
      checkoutResult = await this.signedPost<WaffoCheckoutResult>(
        '/v1/actions/checkout/create-session',
        payload,
        { idempotencyWindow: 60 }
      );
      checkoutUrl = checkoutResult.checkoutUrl;
    }

    if (!checkoutResult.sessionId || !checkoutUrl) {
      throw new Error('Waffo did not return a checkout session');
    }

    return {
      provider: this.name,
      checkoutParams: payload,
      checkoutInfo: {
        sessionId: checkoutResult.sessionId,
        checkoutUrl,
      },
      checkoutResult,
      metadata: { orderMerchantExternalId: order.orderNo },
    };
  }

  async getPaymentSession({
    sessionId,
  }: {
    sessionId: string;
  }): Promise<PaymentSession> {
    const result = await this.signedPost<{ payments?: WaffoPayment[] }>(
      '/v1/graphql',
      {
        query: `query ($ref: String!) {
          payments(filter: { orderMerchantExternalId: { eq: $ref } }) {
            id orderId status createdAt orderMerchantExternalId
            snapshotAmountDetails { currency total subtotal }
            onetimeOrder { id buyerEmail currency status }
            subscriptionOrder {
              id buyerEmail currency status billingPeriod
              currentPeriodStart currentPeriodEnd canceledAt
            }
          }
        }`,
        variables: { ref: sessionId },
      },
      { noIdempotency: true }
    );
    const payments = (result.payments || []).sort(
      (a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '')
    );
    const payment = payments[0];
    if (!payment) {
      return {
        provider: this.name,
        paymentStatus: PaymentStatus.PROCESSING,
        paymentResult: { id: sessionId, orderMerchantExternalId: sessionId },
        metadata: { orderMerchantExternalId: sessionId },
      };
    }

    const subscriptionOrder = payment.subscriptionOrder;
    const orderInfo = subscriptionOrder || payment.onetimeOrder;
    const currency = (
      payment.snapshotAmountDetails?.currency ||
      orderInfo?.currency ||
      'usd'
    ).toLowerCase();
    const total = payment.snapshotAmountDetails?.total;

    return {
      provider: this.name,
      paymentStatus: mapPaymentStatus(payment.status),
      paymentInfo: {
        amount: parseCurrencyAmount(
          payment.snapshotAmountDetails?.subtotal,
          currency
        ),
        currency,
        paymentAmount:
          parseCurrencyAmount(
            total || payment.snapshotAmountDetails?.subtotal,
            currency
          ) || 0,
        paymentCurrency: currency,
        paymentEmail: orderInfo?.buyerEmail,
        paymentUserId: undefined,
        paidAt: payment.createdAt ? new Date(payment.createdAt) : undefined,
        transactionId: payment.id,
        subscriptionCycleType: subscriptionOrder
          ? SubscriptionCycleType.CREATE
          : undefined,
      },
      paymentResult: {
        ...payment,
        id: sessionId,
        orderMerchantExternalId: payment.orderMerchantExternalId || sessionId,
      },
      subscriptionId: subscriptionOrder?.id,
      subscriptionInfo: subscriptionOrder
        ? buildSubscriptionInfo(subscriptionOrder, {
            amount: payment.snapshotAmountDetails?.subtotal,
            currency,
            description: undefined,
          })
        : undefined,
      subscriptionResult: subscriptionOrder,
      metadata: { orderMerchantExternalId: sessionId },
    };
  }

  async getPaymentEvent({ req }: { req: Request }): Promise<PaymentEvent> {
    const rawBody = await req.text();
    const signature = req.headers.get('x-waffo-signature');
    const event = this.verifyWebhook(rawBody, signature);
    const data = event.data || {};
    const orderNo =
      data.orderMerchantExternalId ||
      (typeof data.orderMetadata?.shipanyOrderNo === 'string'
        ? data.orderMetadata.shipanyOrderNo
        : '');

    let eventType: PaymentEventType;
    let paymentStatus: PaymentStatus;
    let subscriptionCycleType: SubscriptionCycleType | undefined;

    switch (event.eventType) {
      case 'order.completed':
      case 'subscription.activated':
        eventType = PaymentEventType.CHECKOUT_SUCCESS;
        paymentStatus = PaymentStatus.SUCCESS;
        break;
      case 'subscription.renewed':
      case 'subscription.recovered':
        eventType = PaymentEventType.PAYMENT_SUCCESS;
        paymentStatus = PaymentStatus.SUCCESS;
        subscriptionCycleType = SubscriptionCycleType.RENEWAL;
        break;
      case 'subscription.canceling':
      case 'subscription.uncanceled':
      case 'subscription.plan_changed':
      case 'subscription.plan_change_scheduled':
      case 'subscription.past_due':
        eventType = PaymentEventType.SUBSCRIBE_UPDATED;
        paymentStatus = PaymentStatus.PROCESSING;
        break;
      case 'subscription.canceled':
        eventType = PaymentEventType.SUBSCRIBE_CANCELED;
        paymentStatus = PaymentStatus.PROCESSING;
        break;
      case 'subscription.payment_succeeded':
        // This event has no current-period data. The paired subscription.renewed
        // event is the canonical signal for extending access and granting credits.
        throw new WebhookIgnoredError(
          'Waffo subscription.payment_succeeded is handled by subscription.renewed'
        );
      default:
        throw new WebhookIgnoredError(
          `No handler for Waffo event: ${event.eventType}`
        );
    }

    if (!orderNo) {
      throw new Error(
        `Waffo ${event.eventType} webhook is missing orderMerchantExternalId`
      );
    }

    const isSubscription = event.eventType.startsWith('subscription.');
    const currency = (data.currency || 'usd').toLowerCase();
    const paymentSession: PaymentSession = {
      provider: this.name,
      paymentStatus,
      paymentInfo: {
        amount: parseCurrencyAmount(data.amount, currency),
        currency,
        paymentAmount: parseCurrencyAmount(data.total || data.amount, currency),
        paymentCurrency: currency,
        paymentEmail: data.buyerEmail,
        paymentUserId: data.merchantProvidedBuyerIdentity,
        transactionId: data.paymentId || event.eventId || event.id || orderNo,
        paidAt: data.paymentDate ? new Date(data.paymentDate) : undefined,
        subscriptionCycleType,
      },
      paymentResult: {
        ...event,
        id: orderNo,
        orderMerchantExternalId: orderNo,
      },
      subscriptionId: isSubscription ? data.orderId : undefined,
      subscriptionInfo: isSubscription
        ? buildSubscriptionInfo(data, {
            status: mapWebhookSubscriptionStatus(event.eventType),
            amount: data.amount,
            currency,
            description: data.productDescription || data.productName,
            canceledAt: data.canceledAt,
            canceledEndAt: data.currentPeriodEnd,
          })
        : undefined,
      subscriptionResult: isSubscription ? event : undefined,
      metadata: data.orderMetadata || { orderMerchantExternalId: orderNo },
    };

    return { eventType, eventResult: event, paymentSession };
  }

  async cancelSubscription({
    subscriptionId,
    customerId,
  }: {
    subscriptionId: string;
    customerId?: string;
  }): Promise<PaymentSession> {
    if (!this.configs.storeId) {
      throw new Error('Waffo Store ID is required to cancel subscriptions');
    }
    if (!customerId) {
      throw new Error(
        'Waffo customer identity is required to cancel subscriptions'
      );
    }

    const tokenResult = await this.signedPost<{ token: string }>(
      '/v1/actions/auth/issue-session-token',
      { storeId: this.configs.storeId, buyerIdentity: customerId }
    );
    const cancellation = await this.customerPost<{ status: string }>(
      '/v1/actions/subscription-order/cancel-order',
      { orderId: subscriptionId },
      tokenResult.token
    );
    const result = await this.signedPost<{
      subscriptionOrder?: {
        id: string;
        status?: string;
        billingPeriod?: string;
        currentPeriodStart?: string;
        currentPeriodEnd?: string;
        canceledAt?: string;
      } | null;
    }>(
      '/v1/graphql',
      {
        query: `query ($id: ID!) {
          subscriptionOrder(id: $id) {
            id status billingPeriod currentPeriodStart currentPeriodEnd canceledAt
          }
        }`,
        variables: { id: subscriptionId },
      },
      { noIdempotency: true }
    );
    const remoteSubscription = result.subscriptionOrder;
    const status =
      cancellation.status || remoteSubscription?.status || 'canceling';
    const start =
      parseDate(remoteSubscription?.currentPeriodStart) || new Date();
    const end = parseDate(remoteSubscription?.currentPeriodEnd) || new Date();

    return {
      provider: this.name,
      subscriptionId,
      subscriptionInfo: {
        subscriptionId,
        interval: mapInterval(remoteSubscription?.billingPeriod).interval,
        intervalCount: mapInterval(remoteSubscription?.billingPeriod).count,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        status: mapSubscriptionStatus(status),
        canceledAt: parseDate(remoteSubscription?.canceledAt) || new Date(),
        canceledEndAt:
          status === 'canceling'
            ? end
            : parseDate(remoteSubscription?.canceledAt),
        canceledReason: 'Canceled by user',
        canceledReasonType: 'user_request',
      },
      subscriptionResult: {
        ...cancellation,
        subscriptionOrder: remoteSubscription,
      },
    };
  }

  private async signedPost<T>(
    path: string,
    payload: Record<string, unknown>,
    options: { idempotencyWindow?: number; noIdempotency?: boolean } = {}
  ): Promise<T> {
    if (!this.configs.merchantId)
      throw new Error('Waffo Merchant ID is required');
    if (!this.configs.privateKey)
      throw new Error('Waffo private key is required');

    const body = JSON.stringify(payload);
    const timestampSeconds = Math.floor(Date.now() / 1000);
    const timestamp = String(timestampSeconds);
    const bodyHash = crypto.createHash('sha256').update(body).digest('base64');
    const canonical = `POST\n${path}\n${timestamp}\n${bodyHash}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(canonical);
    signer.end();
    const signature = signer.sign(
      normalizePrivateKey(this.configs.privateKey),
      'base64'
    );
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Merchant-Id': this.configs.merchantId,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    };

    if (!options.noIdempotency) {
      const base = `${this.configs.merchantId}:${path}:${body}`;
      const idempotencyInput = options.idempotencyWindow
        ? `${base}:${Math.floor(timestampSeconds / options.idempotencyWindow)}`
        : base;
      headers['X-Idempotency-Key'] = crypto
        .createHash('sha256')
        .update(idempotencyInput)
        .digest('hex');
    }

    return this.readEnvelope<T>(
      await fetch(`${WAFFO_API_URL}${path}`, {
        method: 'POST',
        headers,
        body,
      }),
      path
    );
  }

  private async customerPost<T>(
    path: string,
    payload: Record<string, unknown>,
    token: string
  ): Promise<T> {
    return this.readEnvelope<T>(
      await fetch(`${WAFFO_API_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Environment':
            this.configs.environment === 'production' ? 'prod' : 'test',
        },
        body: JSON.stringify(payload),
      }),
      path
    );
  }

  private async readEnvelope<T>(response: Response, path: string): Promise<T> {
    const envelope = (await response
      .json()
      .catch(() => null)) as WaffoEnvelope<T> | null;
    const errors = envelope?.errors
      ?.map((error) => error.message)
      .filter(Boolean);
    if (!response.ok || errors?.length || envelope?.data == null) {
      throw new Error(
        errors?.join('; ') ||
          `Waffo request to ${path} failed (${response.status})`
      );
    }
    return envelope.data;
  }

  private verifyWebhook(
    rawBody: string,
    signatureHeader: string | null
  ): WaffoWebhookEvent {
    if (!rawBody || !signatureHeader) {
      throw new Error('Invalid Waffo webhook request');
    }

    const fields = Object.fromEntries(
      signatureHeader.split(',').flatMap((part) => {
        const index = part.indexOf('=');
        return index < 0
          ? []
          : [[part.slice(0, index).trim(), part.slice(index + 1).trim()]];
      })
    );
    const timestamp = fields.t;
    const signature = fields.v1;
    if (!timestamp || !signature) {
      throw new Error('Malformed X-Waffo-Signature header');
    }

    const rawTimestamp = Number(timestamp);
    if (!Number.isFinite(rawTimestamp)) {
      throw new Error('Invalid Waffo webhook timestamp');
    }
    const timestampMs =
      rawTimestamp < 1_000_000_000_000 ? rawTimestamp * 1000 : rawTimestamp;
    const ageMs = Date.now() - timestampMs;
    if (ageMs > WEBHOOK_TOLERANCE_MS || ageMs < -WEBHOOK_FUTURE_TOLERANCE_MS) {
      throw new Error('Waffo webhook timestamp is outside the replay window');
    }

    const environment =
      this.configs.environment === 'production' ? 'prod' : 'test';
    const configuredKey =
      environment === 'test'
        ? this.configs.webhookTestPublicKey
        : this.configs.webhookProdPublicKey;
    const key = configuredKey
      ? normalizePublicKey(configuredKey)
      : environment === 'test'
        ? WAFFO_TEST_WEBHOOK_PUBLIC_KEY
        : WAFFO_PROD_WEBHOOK_PUBLIC_KEY;
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${timestamp}.${rawBody}`);
    verifier.end();
    if (!verifier.verify(key, signature, 'base64')) {
      throw new Error(`Invalid Waffo ${environment} webhook signature`);
    }

    const event = JSON.parse(rawBody) as WaffoWebhookEvent;
    if (!event?.eventType || !event.data) {
      throw new Error('Invalid Waffo webhook payload');
    }
    return event;
  }
}

function normalizePrivateKey(value: string): string {
  const pem = value.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
  if (pem.includes('-----BEGIN')) return pem;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(pem)) {
    throw new Error('Waffo private key must be PEM or base64 encoded');
  }
  const base64 = pem.replace(/\s+/g, '');
  const wrapped = base64.match(/.{1,64}/g)?.join('\n');
  if (!wrapped) throw new Error('Waffo private key is empty');
  return `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----`;
}

function normalizePublicKey(value: string): string {
  const pem = value.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim();
  if (pem.includes('-----BEGIN')) return pem;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(pem)) {
    throw new Error('Waffo webhook public key must be PEM or base64 encoded');
  }
  const base64 = pem.replace(/\s+/g, '');
  const wrapped = base64.match(/.{1,64}/g)?.join('\n');
  if (!wrapped) throw new Error('Waffo webhook public key is empty');
  return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
}

function toStringRecord(
  value?: Record<string, unknown>
): Record<string, string> {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => [
      key,
      typeof field === 'string' ? field : JSON.stringify(field),
    ])
  );
}

function parseCurrencyAmount(
  value: string | undefined,
  currency: string
): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const zeroDecimal = new Set([
    'bif',
    'clp',
    'djf',
    'gnf',
    'isk',
    'jpy',
    'kmf',
    'krw',
    'pyg',
    'rwf',
    'ugx',
    'vnd',
    'vuv',
    'xaf',
    'xof',
    'xpf',
  ]);
  const threeDecimal = new Set(['bhd', 'jod', 'kwd', 'omr', 'tnd']);
  const decimals = zeroDecimal.has(currency.toLowerCase())
    ? 0
    : threeDecimal.has(currency.toLowerCase())
      ? 3
      : 2;
  const amount = Number(value);
  return Number.isFinite(amount)
    ? Math.round(amount * 10 ** decimals)
    : undefined;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function mapPaymentStatus(status?: string): PaymentStatus {
  switch (status?.toLowerCase()) {
    case 'succeeded':
    case 'paid':
    case 'completed':
      return PaymentStatus.SUCCESS;
    case 'failed':
    case 'declined':
      return PaymentStatus.FAILED;
    case 'canceled':
    case 'cancelled':
      return PaymentStatus.CANCELED;
    default:
      return PaymentStatus.PROCESSING;
  }
}

function mapInterval(value?: string): {
  interval: PaymentInterval;
  count: number;
} {
  switch (value?.toLowerCase()) {
    case 'weekly':
      return { interval: PaymentInterval.WEEK, count: 1 };
    case 'monthly':
      return { interval: PaymentInterval.MONTH, count: 1 };
    case 'quarterly':
      return { interval: PaymentInterval.MONTH, count: 3 };
    case 'yearly':
      return { interval: PaymentInterval.YEAR, count: 1 };
    default:
      return { interval: PaymentInterval.MONTH, count: 1 };
  }
}

function mapSubscriptionStatus(value?: string): SubscriptionStatus {
  switch (value?.toLowerCase()) {
    case 'canceling':
      return SubscriptionStatus.PENDING_CANCEL;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'past_due':
      return SubscriptionStatus.PAUSED;
    case 'expired':
      return SubscriptionStatus.EXPIRED;
    default:
      return SubscriptionStatus.ACTIVE;
  }
}

function mapWebhookSubscriptionStatus(eventType: string): SubscriptionStatus {
  switch (eventType) {
    case 'subscription.canceling':
      return SubscriptionStatus.PENDING_CANCEL;
    case 'subscription.canceled':
      return SubscriptionStatus.CANCELED;
    case 'subscription.past_due':
      return SubscriptionStatus.PAUSED;
    default:
      return SubscriptionStatus.ACTIVE;
  }
}

function buildSubscriptionInfo(
  subscription: {
    id?: string;
    orderId?: string;
    billingPeriod?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    canceledAt?: string;
    status?: string;
    productId?: string;
  },
  options: {
    status?: SubscriptionStatus;
    amount?: string;
    currency?: string;
    description?: string;
    canceledAt?: string;
    canceledEndAt?: string;
  }
): SubscriptionInfo {
  const period = mapInterval(subscription.billingPeriod);
  const now = new Date();
  const currentPeriodStart = parseDate(subscription.currentPeriodStart) || now;
  const currentPeriodEnd = parseDate(subscription.currentPeriodEnd) || now;
  const canceledAt = parseDate(options.canceledAt || subscription.canceledAt);

  return {
    subscriptionId: subscription.id || subscription.orderId || '',
    productId: subscription.productId,
    description: options.description,
    amount: parseCurrencyAmount(options.amount, options.currency || 'usd'),
    currency: options.currency?.toLowerCase(),
    interval: period.interval,
    intervalCount: period.count,
    currentPeriodStart,
    currentPeriodEnd,
    status: options.status || mapSubscriptionStatus(subscription.status),
    canceledAt,
    canceledEndAt: parseDate(options.canceledEndAt),
  };
}
