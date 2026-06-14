import { getStripe, jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const stripe = getStripe();
    const { amount, applicationId, currency = 'gbp', description } = parseBody(event);

    if (!amount || amount < 50) {
      return jsonResponse(400, { error: 'Invalid payment amount' });
    }

    if (!applicationId) {
      return jsonResponse(400, { error: 'Application ID is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        applicationId,
        type: 'visa_application',
      },
      description: description || `Borderly visa application ${applicationId}`,
    });

    return jsonResponse(200, { clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('create-payment-intent error:', error);
    return jsonResponse(500, {
      error: error.message || 'Failed to create payment intent',
    });
  }
};
