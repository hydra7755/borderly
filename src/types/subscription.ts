export type SubscriptionTier = 'free' | 'monthly' | 'lifetime';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  currency: string;
  benefits: string[];
  visa_discount_percentage: number;
  daily_visa_checks: number;
  billing_period?: 'monthly' | 'annually' | 'one-time';
  is_popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free-tier',
    name: 'Free',
    tier: 'free',
    price: 0,
    currency: 'GBP',
    benefits: [
      'Basic travel score',
      '5 visa checks per day',
      'No visa application discounts',
      'Access to basic dashboard',
    ],
    visa_discount_percentage: 0,
    daily_visa_checks: 5,
  },
  {
    id: 'monthly-tier',
    name: 'Monthly',
    tier: 'monthly',
    price: 10,
    currency: 'GBP',
    benefits: [
      'Advanced travel score with more metrics',
      'Unlimited visa checks',
      '5% discount on all visa applications',
      'Full access to all dashboard features',
      'AI travel assistant access',
    ],
    visa_discount_percentage: 5,
    daily_visa_checks: Infinity,
    billing_period: 'monthly',
    is_popular: true,
  },
  {
    id: 'lifetime-tier',
    name: 'Lifetime',
    tier: 'lifetime',
    price: 149,
    currency: 'GBP',
    benefits: [
      'All features from Monthly tier',
      'One-time payment, lifetime access',
      '10% discount on all visa applications',
      'Priority processing on visa applications',
      'Personalized travel recommendations',
    ],
    visa_discount_percentage: 10,
    daily_visa_checks: Infinity,
    billing_period: 'one-time',
  },
]; 