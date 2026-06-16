-- Run in Supabase SQL Editor to grant Premium to a paid member when Stripe sync has not run yet.
-- Replace the email if needed.

UPDATE public.profiles
SET
  subscription_tier = 'premium',
  updated_at = timezone('utc'::text, now())
WHERE lower(email) = lower('haidary555@yahoo.com');

-- Optional: verify
SELECT id, email, subscription_tier, updated_at
FROM public.profiles
WHERE lower(email) = lower('haidary555@yahoo.com');
