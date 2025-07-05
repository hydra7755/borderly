import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../supabase/client';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

/**
 * Service to handle Stripe-related operations
 */
class StripeService {
  /**
   * Create a checkout session for subscription payment
   * @param subscriptionType The type of subscription (premium/enterprise)
   * @param billingCycle The billing cycle (monthly/annual/lifetime)
   * @returns Checkout session ID
   */
  async createCheckoutSession(
    subscriptionType: string,
    billingCycle: 'monthly' | 'annual' | 'lifetime'
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          subscriptionType, 
          billingCycle,
          successUrl: window.location.origin + '/subscription/success',
          cancelUrl: window.location.origin + '/pricing'
        }
      });

      if (error) {
        throw new Error(`Error creating checkout session: ${error.message}`);
      }

      return data.sessionId;
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe checkout
   * @param sessionId The Stripe checkout session ID
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Error during redirectToCheckout:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in redirectToCheckout:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for one-time visa application payment
   * @param amount Amount to charge in cents
   * @param applicationId The visa application ID
   * @returns Payment intent client secret
   */
  async createPaymentIntent(amount: number, applicationId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          amount,
          applicationId,
          currency: 'gbp'
        }
      });

      if (error) {
        throw new Error(`Error creating payment intent: ${error.message}`);
      }

      return data.clientSecret;
    } catch (error) {
      console.error('Error in createPaymentIntent:', error);
      throw error;
    }
  }

  /**
   * Check if a user has an active subscription
   * @returns Whether the user has an active subscription
   */
  async checkSubscriptionStatus(): Promise<{
    isActive: boolean;
    tier?: string;
    expiry?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription-status');

      if (error) {
        throw new Error(`Error checking subscription status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in checkSubscriptionStatus:', error);
      return { isActive: false };
    }
  }
}

export const stripeService = new StripeService(); 