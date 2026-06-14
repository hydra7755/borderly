import { getStripe, jsonResponse, handleOptions } from './stripe-shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const stripe = getStripe();
    const sessionId = event.queryStringParameters?.session_id;

    if (!sessionId) {
      return jsonResponse(400, { error: 'session_id is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid =
      session.payment_status === 'paid' || session.status === 'complete';

    return jsonResponse(200, {
      paid,
      subscriptionType: session.metadata?.subscriptionType || null,
      billingCycle: session.metadata?.billingCycle || null,
      customerEmail: session.customer_details?.email || session.customer_email,
      paymentStatus: session.payment_status,
      status: session.status,
    });
  } catch (error) {
    console.error('get-checkout-session error:', error);
    return jsonResponse(500, {
      error: error.message || 'Failed to retrieve checkout session',
    });
  }
};
