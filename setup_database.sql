-- Setup script for TravelScore database
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing functions and triggers first
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Create the handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE,
    full_name TEXT,
    nationality TEXT,
    residency TEXT,
    travel_score INT8 DEFAULT 0,
    subscription_tier TEXT DEFAULT 'free',
    questionnaire_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    role TEXT DEFAULT 'user'
);

-- Create other tables
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    start_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS upcoming_trips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    destination TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS travel_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL,
    visit_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS saved_countries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, country_code)
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    size INT8,
    expiry_date TIMESTAMPTZ,
    uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Create triggers
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER handle_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_upcoming_trips_updated_at ON upcoming_trips;
CREATE TRIGGER handle_upcoming_trips_updated_at
    BEFORE UPDATE ON upcoming_trips
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_documents_updated_at ON documents;
CREATE TRIGGER handle_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own trips" ON upcoming_trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON upcoming_trips;
DROP POLICY IF EXISTS "Users can update own trips" ON upcoming_trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON upcoming_trips;
DROP POLICY IF EXISTS "Users can view own travel history" ON travel_history;
DROP POLICY IF EXISTS "Users can insert own travel history" ON travel_history;
DROP POLICY IF EXISTS "Users can delete own travel history" ON travel_history;
DROP POLICY IF EXISTS "Users can view own saved countries" ON saved_countries;
DROP POLICY IF EXISTS "Users can insert own saved countries" ON saved_countries;
DROP POLICY IF EXISTS "Users can delete own saved countries" ON saved_countries;
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Create RLS policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING ( auth.uid() = id );

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING ( auth.uid() = id );

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can update own subscriptions"
    ON subscriptions FOR UPDATE
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can view own trips"
    ON upcoming_trips FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own trips"
    ON upcoming_trips FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own trips"
    ON upcoming_trips FOR UPDATE
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete own trips"
    ON upcoming_trips FOR DELETE
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can view own travel history"
    ON travel_history FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own travel history"
    ON travel_history FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete own travel history"
    ON travel_history FOR DELETE
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can view own saved countries"
    ON saved_countries FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own saved countries"
    ON saved_countries FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete own saved countries"
    ON saved_countries FOR DELETE
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own documents"
    ON documents FOR UPDATE
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete own documents"
    ON documents FOR DELETE
    USING ( auth.uid() = user_id );

-- Create the new user handler function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, nationality, residency)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'nationality', ''),
        COALESCE(NEW.raw_user_meta_data->>'residency', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Success message
SELECT 'Database setup completed successfully!' AS status; 