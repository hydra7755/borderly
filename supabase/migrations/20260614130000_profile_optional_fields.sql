-- Optional profile fields for account settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_expiry DATE;
