/** Borderly visa application service fee (GBP). Discount applied by subscription tier at checkout. */

export const BASE_SERVICE_FEE_GBP = 50;

/** Service-fee discount % by subscription tier (matches Pricing: Premium 10%, Enterprise 20%). */
export const SERVICE_FEE_DISCOUNT_PERCENT: Record<string, number> = {
  free: 0,
  none: 0,
  basic: 0,
  premium: 10,
  monthly: 10,
  enterprise: 20,
  business: 20,
  lifetime: 10,
};

export function getServiceFeeDiscountPercent(tier?: string | null): number {
  if (!tier) return 0;
  return SERVICE_FEE_DISCOUNT_PERCENT[tier.toLowerCase()] ?? 0;
}

export function getDiscountedServiceFeeGbp(discountPercent: number): number {
  return Number((BASE_SERVICE_FEE_GBP * (1 - discountPercent / 100)).toFixed(2));
}

export function formatGbp(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
