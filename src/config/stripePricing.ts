/** Subscription prices in GBP (display values). Amounts in pence for Stripe live in netlify/functions/stripe-shared.mjs */
export const SUBSCRIPTION_PRICES_GBP = {
  premium: {
    monthly: 9.98,
    annual: 99.98,
    lifetime: 198,
  },
  enterprise: {
    monthly: 19.98,
    annual: 199.98,
    lifetime: 398,
  },
} as const;

export type SubscriptionType = keyof typeof SUBSCRIPTION_PRICES_GBP;
export type BillingCycle = 'monthly' | 'annual' | 'lifetime';

export function getSubscriptionPrice(
  type: SubscriptionType,
  cycle: BillingCycle
): number {
  return SUBSCRIPTION_PRICES_GBP[type][cycle];
}

export function formatGbp(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
