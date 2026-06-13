-- Sync nationality/residency from auth metadata on signup; persist visa applications

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, nationality, residency)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'nationality', '')), ''),
        NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'residency', '')), '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
        nationality = COALESCE(NULLIF(EXCLUDED.nationality, ''), profiles.nationality),
        residency = COALESCE(NULLIF(EXCLUDED.residency, ''), profiles.residency),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.visa_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nationality_code VARCHAR(10),
    destination_code VARCHAR(10) NOT NULL,
    destination_name TEXT,
    visa_type TEXT DEFAULT 'evisa',
    status TEXT DEFAULT 'submitted' CHECK (
        status IN ('pending', 'submitted', 'in_review', 'processing', 'approved', 'rejected')
    ),
    application_date TIMESTAMPTZ DEFAULT NOW(),
    documents_uploaded BOOLEAN DEFAULT FALSE,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    approval_date TIMESTAMPTZ,
    visa_document_url TEXT,
    purpose_of_visit TEXT,
    entry_date DATE,
    exit_date DATE,
    application_data JSONB,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visa_applications_user_id_idx ON public.visa_applications(user_id);
CREATE INDEX IF NOT EXISTS visa_applications_status_idx ON public.visa_applications(status);

ALTER TABLE public.visa_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS visa_applications_select_own ON public.visa_applications;
CREATE POLICY visa_applications_select_own
    ON public.visa_applications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS visa_applications_insert_own ON public.visa_applications;
CREATE POLICY visa_applications_insert_own
    ON public.visa_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS visa_applications_update_own ON public.visa_applications;
CREATE POLICY visa_applications_update_own
    ON public.visa_applications FOR UPDATE
    USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS handle_visa_applications_updated_at ON public.visa_applications;
CREATE TRIGGER handle_visa_applications_updated_at
    BEFORE UPDATE ON public.visa_applications
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
