import { getStripe, jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const stripe = getStripe();
    const { email } = parseBody(event);

    if (!email || typeof email !== 'string') {
      return jsonResponse(400, { error: 'email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const customers = await stripe.customers.list({ email: normalizedEmail, limit: 5 });

    let subscription = null;
    let customerId = null;

    for (const customer of customers.data) {
      customerId = customer.id;
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 10,
      });
      if (subs.data.length > 0) {
        subscription = subs.data[0];
        break;
      }
    }

    if (!subscription) {
      const sessions = await stripe.checkout.sessions.list({ limit: 100 });
      const lifetimePaid = sessions.data.find((session) => {
        const sessionEmail = (
          session.customer_details?.email || session.customer_email || ''
        ).toLowerCase();
        if (sessionEmail !== normalizedEmail) return false;
        const paid = session.payment_status === 'paid' || session.status === 'complete';
        const isLifetime =
          session.mode === 'payment' || session.metadata?.billingCycle === 'lifetime';
        return paid && isLifetime;
      });

      if (lifetimePaid) {
        return jsonResponse(400, {
          error:
            'Lifetime memberships cannot be cancelled online. Contact support if you need assistance.',
          isLifetime: true,
        });
      }

      return jsonResponse(404, {
        error: 'No active recurring subscription found for this account.',
      });
    }

    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    return jsonResponse(200, {
      success: true,
      subscriptionId: updated.id,
      customerId,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      periodEnd: updated.current_period_end,
      message:
        'Your subscription will cancel at the end of the current billing period. Premium access continues until then.',
    });
  } catch (error) {
    console.error('cancel-subscription error:', error);
    return jsonResponse(500, {
      error: error.message || 'Failed to cancel subscription',
    });
  }
};
