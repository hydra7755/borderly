import {
  getStripe,
  SUBSCRIPTION_AMOUNTS_GBP,
  jsonResponse,
  handleOptions,
  parseBody,
} from './stripe-shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const stripe = getStripe();
    const {
      subscriptionType,
      billingCycle,
      successUrl,
      cancelUrl,
      customerEmail,
    } = parseBody(event);

    if (!subscriptionType || !billingCycle || !successUrl || !cancelUrl) {
      return jsonResponse(400, { error: 'Missing required fields' });
    }

    const planAmounts = SUBSCRIPTION_AMOUNTS_GBP[subscriptionType];
    if (!planAmounts) {
      return jsonResponse(400, { error: 'Invalid subscription type' });
    }

    const amount = planAmounts[billingCycle];
    if (!amount) {
      return jsonResponse(400, { error: 'Invalid billing cycle' });
    }

    const planLabel =
      subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);

    const lineItem =
      billingCycle === 'lifetime'
        ? {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: `Borderly ${planLabel} Lifetime`,
                description: 'One-time payment for lifetime access',
              },
              unit_amount: amount,
            },
            quantity: 1,
          }
        : {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: `Borderly ${planLabel}`,
                description: `${billingCycle} subscription`,
              },
              unit_amount: amount,
              recurring: {
                interval: billingCycle === 'monthly' ? 'month' : 'year',
              },
            },
            quantity: 1,
          };

    const session = await stripe.checkout.sessions.create({
      mode: billingCycle === 'lifetime' ? 'payment' : 'subscription',
      line_items: [lineItem],
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      metadata: {
        subscriptionType,
        billingCycle,
      },
    });

    return jsonResponse(200, { sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('create-checkout-session error:', error);
    return jsonResponse(500, {
      error: error.message || 'Failed to create checkout session',
    });
  }
};
