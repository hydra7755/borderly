-- Visa requirements lookup table (nationality + destination ISO codes)
CREATE TABLE IF NOT EXISTS public.visa_requirements (
    id SERIAL PRIMARY KEY,
    nationality VARCHAR(2) NOT NULL,
    destination VARCHAR(2) NOT NULL,
    requirement VARCHAR(20) NOT NULL CHECK (requirement IN ('visa-free', 'visa-on-arrival', 'evisa', 'eta', 'visa-required', 'not-applicable')),
    stay_duration INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (nationality, destination)
);

CREATE INDEX IF NOT EXISTS visa_requirements_nationality_idx ON public.visa_requirements (nationality);
CREATE INDEX IF NOT EXISTS visa_requirements_destination_idx ON public.visa_requirements (destination);
CREATE INDEX IF NOT EXISTS visa_requirements_nat_dest_idx ON public.visa_requirements (nationality, destination);

ALTER TABLE public.visa_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS visa_requirements_select_policy ON public.visa_requirements;
CREATE POLICY visa_requirements_select_policy
ON public.visa_requirements
FOR SELECT
USING (true);
