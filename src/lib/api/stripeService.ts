import { loadStripe, Stripe } from '@stripe/stripe-js';
import authService from './auth';
import { SubscriptionType, BillingCycle } from '../../config/stripePricing';
import { getStripePublishableKey } from '../../config/stripeEnv';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> {
  const stripePublishableKey = getStripePublishableKey();
  if (!stripePublishableKey) {
    console.warn('VITE_STRIPE_PUBLIC_KEY is not configured');
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
}

const API_BASE = '/.netlify/functions';

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}/${path}?${query}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

class StripeService {
  async createCheckoutSession(
    subscriptionType: SubscriptionType,
    billingCycle: BillingCycle
  ): Promise<{ sessionId: string; url: string }> {
    const { user } = await authService.getCurrentUser();

    return postJson('create-checkout-session', {
      subscriptionType,
      billingCycle,
      successUrl: `${window.location.origin}/subscription-success`,
      cancelUrl: `${window.location.origin}/pricing`,
      customerEmail: user?.email,
    });
  }

  async redirectToCheckout(sessionUrl: string): Promise<void> {
    window.location.href = sessionUrl;
  }

  async createPaymentIntent(amountPence: number, applicationId: string): Promise<string> {
    const data = await postJson<{ clientSecret: string }>('create-payment-intent', {
      amount: amountPence,
      applicationId,
      currency: 'gbp',
    });
    return data.clientSecret;
  }

  async verifyCheckoutSession(sessionId: string): Promise<{
    paid: boolean;
    subscriptionType: string | null;
    billingCycle: string | null;
    customerEmail: string | null;
  }> {
    return getJson('get-checkout-session', { session_id: sessionId });
  }

  isConfigured(): boolean {
    return Boolean(getStripePublishableKey());
  }
}

export const stripeService = new StripeService();
