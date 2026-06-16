import { getStripe, jsonResponse, handleOptions, parseBody } from './stripe-shared.mjs';

const TIER_RANK = { premium: 1, enterprise: 2 };

function pickBestTier(current, candidate) {
  if (!candidate) return current;
  const normalized = candidate.toLowerCase();
  if (!TIER_RANK[normalized]) return current;
  if (!current) return normalized;
  return TIER_RANK[normalized] > TIER_RANK[current] ? normalized : current;
}

function sessionIsPaid(session) {
  return session.payment_status === 'paid' || session.status === 'complete';
}

function applyCandidate(state, candidate) {
  if (!candidate.active) return state;

  const next = { ...state, active: true };
  next.tier = pickBestTier(state.tier, candidate.tier || 'premium');
  next.billingCycle = candidate.billingCycle || state.billingCycle;
  next.customerId = candidate.customerId || state.customerId;
  next.subscriptionId = candidate.subscriptionId || state.subscriptionId;
  next.periodEnd = candidate.periodEnd || state.periodEnd;
  next.cancelAtPeriodEnd = candidate.cancelAtPeriodEnd ?? state.cancelAtPeriodEnd;
  next.isLifetime = candidate.isLifetime || state.isLifetime;
  return next;
}

async function inspectCustomer(stripe, customer) {
  let state = {
    active: false,
    tier: null,
    billingCycle: null,
    customerId: customer.id,
    subscriptionId: null,
    periodEnd: null,
    cancelAtPeriodEnd: false,
    isLifetime: false,
  };

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'all',
    limit: 20,
  });

  for (const sub of subscriptions.data) {
    if (!['active', 'trialing', 'past_due'].includes(sub.status)) continue;
    state = applyCandidate(state, {
      active: true,
      tier: sub.metadata?.subscriptionType || 'premium',
      billingCycle: sub.metadata?.billingCycle || 'monthly',
      customerId: customer.id,
      subscriptionId: sub.id,
      periodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      isLifetime: false,
    });
  }

  const sessions = await stripe.checkout.sessions.list({
    customer: customer.id,
    limit: 25,
  });

  for (const session of sessions.data) {
    if (!sessionIsPaid(session)) continue;
    const isLifetime = session.mode === 'payment' || session.metadata?.billingCycle === 'lifetime';
    state = applyCandidate(state, {
      active: true,
      tier: session.metadata?.subscriptionType || 'premium',
      billingCycle: session.metadata?.billingCycle || (isLifetime ? 'lifetime' : 'monthly'),
      customerId: customer.id,
      subscriptionId: typeof session.subscription === 'string' ? session.subscription : state.subscriptionId,
      isLifetime,
    });
  }

  return state;
}

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
    let state = {
      active: false,
      tier: null,
      billingCycle: null,
      customerId: null,
      subscriptionId: null,
      periodEnd: null,
      cancelAtPeriodEnd: false,
      isLifetime: false,
    };

    const customers = await stripe.customers.list({ email: normalizedEmail, limit: 5 });
    for (const customer of customers.data) {
      state = applyCandidate(state, await inspectCustomer(stripe, customer));
    }

    if (!state.active) {
      const sessions = await stripe.checkout.sessions.list({ limit: 100 });
      for (const session of sessions.data) {
        const sessionEmail = (
          session.customer_details?.email || session.customer_email || ''
        ).toLowerCase();
        if (sessionEmail !== normalizedEmail) continue;
        if (!sessionIsPaid(session)) continue;
        const isLifetime = session.mode === 'payment' || session.metadata?.billingCycle === 'lifetime';
        state = applyCandidate(state, {
          active: true,
          tier: session.metadata?.subscriptionType || 'premium',
          billingCycle: session.metadata?.billingCycle || (isLifetime ? 'lifetime' : 'monthly'),
          customerId: typeof session.customer === 'string' ? session.customer : state.customerId,
          subscriptionId: typeof session.subscription === 'string' ? session.subscription : state.subscriptionId,
          isLifetime,
        });
      }
    }

    return jsonResponse(200, {
      active: state.active,
      tier: state.active ? state.tier || 'premium' : null,
      billingCycle: state.billingCycle,
      customerId: state.customerId,
      subscriptionId: state.subscriptionId,
      periodEnd: state.periodEnd,
      cancelAtPeriodEnd: state.cancelAtPeriodEnd,
      isLifetime: state.isLifetime,
    });
  } catch (error) {
    console.error('sync-subscription error:', error);
    return jsonResponse(500, {
      error: error.message || 'Failed to sync subscription',
    });
  }
};
