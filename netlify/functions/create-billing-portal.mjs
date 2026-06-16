import { getStripe, jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const stripe = getStripe();
    const { email, returnUrl } = parseBody(event);

    if (!email || typeof email !== 'string') {
      return jsonResponse(400, { error: 'email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const customers = await stripe.customers.list({ email: normalizedEmail, limit: 1 });

    if (!customers.data.length) {
      return jsonResponse(404, { error: 'No Stripe customer found for this email.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl || 'https://borderly.net/dashboard',
    });

    return jsonResponse(200, { url: portalSession.url });
  } catch (error) {
    console.error('create-billing-portal error:', error);
    return jsonResponse(500, {
      error: error.message || 'Failed to open billing portal',
    });
  }
};
