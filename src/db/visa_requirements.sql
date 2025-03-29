-- Create visa_requirements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.visa_requirements (
    id SERIAL PRIMARY KEY,
    nationality VARCHAR(2) NOT NULL,
    destination VARCHAR(2) NOT NULL,
    requirement VARCHAR(20) NOT NULL CHECK (requirement IN ('visa-free', 'visa-on-arrival', 'evisa', 'eta', 'visa-required', 'not-applicable')),
    stay_duration INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nationality, destination)
);

-- Comment on table and columns
COMMENT ON TABLE public.visa_requirements IS 'Visa requirements between countries';
COMMENT ON COLUMN public.visa_requirements.nationality IS 'ISO country code of the passport holder';
COMMENT ON COLUMN public.visa_requirements.destination IS 'ISO country code of the destination country';
COMMENT ON COLUMN public.visa_requirements.requirement IS 'Type of visa requirement (visa-free, visa-on-arrival, evisa, eta, visa-required, not-applicable)';
COMMENT ON COLUMN public.visa_requirements.stay_duration IS 'Maximum stay duration in days, if applicable';
COMMENT ON COLUMN public.visa_requirements.notes IS 'Additional notes about the visa requirement';

-- Create RLS policies
ALTER TABLE public.visa_requirements ENABLE ROW LEVEL SECURITY;

-- Allow public read access to visa_requirements
CREATE POLICY visa_requirements_select_policy
ON public.visa_requirements
FOR SELECT
USING (true);

-- Only allow authenticated users to insert/update/delete
CREATE POLICY visa_requirements_insert_policy
ON public.visa_requirements
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY visa_requirements_update_policy
ON public.visa_requirements
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY visa_requirements_delete_policy
ON public.visa_requirements
FOR DELETE
USING (auth.role() = 'authenticated');

-- Add sample data

-- United States
INSERT INTO public.visa_requirements (nationality, destination, requirement, stay_duration, notes)
VALUES 
('us', 'ca', 'visa-free', 180, 'Americans can visit Canada for up to 180 days without a visa.'),
('us', 'mx', 'visa-free', 180, 'Americans can visit Mexico for up to 180 days without a visa.'),
('us', 'gb', 'visa-free', 180, 'Americans can visit the UK for up to 6 months without a visa.'),
('us', 'fr', 'visa-free', 90, 'Americans can visit France (Schengen Area) for up to 90 days within a 180-day period without a visa.'),
('us', 'de', 'visa-free', 90, 'Americans can visit Germany (Schengen Area) for up to 90 days within a 180-day period without a visa.'),
('us', 'cn', 'visa-required', NULL, 'Americans need a visa to visit China.'),
('us', 'in', 'evisa', 60, 'Americans can apply for an eVisa to visit India for up to 60 days.'),
('us', 'jp', 'visa-free', 90, 'Americans can visit Japan for up to 90 days without a visa.'),
('us', 'au', 'eta', 90, 'Americans need an Electronic Travel Authorization to visit Australia for up to 90 days.'),
('us', 'sg', 'visa-free', 90, 'Americans can visit Singapore for up to 90 days without a visa.')
ON CONFLICT (nationality, destination) DO UPDATE
SET requirement = EXCLUDED.requirement,
    stay_duration = EXCLUDED.stay_duration,
    notes = EXCLUDED.notes;

-- United Kingdom
INSERT INTO public.visa_requirements (nationality, destination, requirement, stay_duration, notes)
VALUES 
('gb', 'us', 'visa-free', 90, 'British citizens can visit the US for up to 90 days without a visa under the Visa Waiver Program (ESTA required).'),
('gb', 'ca', 'visa-free', 180, 'British citizens can visit Canada for up to 6 months without a visa (eTA required).'),
('gb', 'au', 'eta', 90, 'British citizens need an Electronic Travel Authorization to visit Australia for up to 90 days.'),
('gb', 'in', 'evisa', 60, 'British citizens can apply for an eVisa to visit India for up to 60 days.'),
('gb', 'cn', 'visa-required', NULL, 'British citizens need a visa to visit China.'),
('gb', 'jp', 'visa-free', 90, 'British citizens can visit Japan for up to 90 days without a visa.'),
('gb', 'sg', 'visa-free', 90, 'British citizens can visit Singapore for up to 90 days without a visa.'),
('gb', 'th', 'visa-free', 30, 'British citizens can visit Thailand for up to 30 days without a visa.')
ON CONFLICT (nationality, destination) DO UPDATE
SET requirement = EXCLUDED.requirement,
    stay_duration = EXCLUDED.stay_duration,
    notes = EXCLUDED.notes;

-- India
INSERT INTO public.visa_requirements (nationality, destination, requirement, stay_duration, notes)
VALUES 
('in', 'us', 'visa-required', NULL, 'Indian citizens need a visa to visit the United States.'),
('in', 'gb', 'visa-required', NULL, 'Indian citizens need a visa to visit the United Kingdom.'),
('in', 'sg', 'visa-free', 30, 'Indian citizens can visit Singapore for up to 30 days without a visa.'),
('in', 'th', 'visa-on-arrival', 15, 'Indian citizens can obtain a visa on arrival in Thailand for up to 15 days.'),
('in', 'np', 'visa-free', NULL, 'Indian citizens do not need a visa to visit Nepal.'),
('in', 'bt', 'visa-free', NULL, 'Indian citizens do not need a visa to visit Bhutan.'),
('in', 'jp', 'visa-required', NULL, 'Indian citizens need a visa to visit Japan.'),
('in', 'ae', 'visa-on-arrival', 14, 'Indian citizens with a valid US visa or green card can obtain a visa on arrival in the UAE for up to 14 days.')
ON CONFLICT (nationality, destination) DO UPDATE
SET requirement = EXCLUDED.requirement,
    stay_duration = EXCLUDED.stay_duration,
    notes = EXCLUDED.notes;

-- Canada
INSERT INTO public.visa_requirements (nationality, destination, requirement, stay_duration, notes)
VALUES 
('ca', 'us', 'visa-free', 180, 'Canadian citizens can visit the US for up to 180 days without a visa.'),
('ca', 'gb', 'visa-free', 180, 'Canadian citizens can visit the UK for up to 6 months without a visa.'),
('ca', 'fr', 'visa-free', 90, 'Canadian citizens can visit France (Schengen Area) for up to 90 days within a 180-day period without a visa.'),
('ca', 'au', 'eta', 90, 'Canadian citizens need an Electronic Travel Authorization to visit Australia for up to 90 days.'),
('ca', 'cn', 'visa-required', NULL, 'Canadian citizens need a visa to visit China.'),
('ca', 'in', 'evisa', 60, 'Canadian citizens can apply for an eVisa to visit India for up to 60 days.')
ON CONFLICT (nationality, destination) DO UPDATE
SET requirement = EXCLUDED.requirement,
    stay_duration = EXCLUDED.stay_duration,
    notes = EXCLUDED.notes;

-- Germany
INSERT INTO public.visa_requirements (nationality, destination, requirement, stay_duration, notes)
VALUES 
('de', 'us', 'visa-free', 90, 'German citizens can visit the US for up to 90 days without a visa under the Visa Waiver Program (ESTA required).'),
('de', 'ca', 'visa-free', 180, 'German citizens can visit Canada for up to 6 months without a visa (eTA required).'),
('de', 'cn', 'visa-required', NULL, 'German citizens need a visa to visit China.'),
('de', 'in', 'evisa', 60, 'German citizens can apply for an eVisa to visit India for up to 60 days.'),
('de', 'jp', 'visa-free', 90, 'German citizens can visit Japan for up to 90 days without a visa.'),
('de', 'au', 'eta', 90, 'German citizens need an Electronic Travel Authorization to visit Australia for up to 90 days.')
ON CONFLICT (nationality, destination) DO UPDATE
SET requirement = EXCLUDED.requirement,
    stay_duration = EXCLUDED.stay_duration,
    notes = EXCLUDED.notes;

-- Japan
INSERT INTO public.visa_requirements (nationality, destination, requirement, stay_duration, notes)
VALUES 
('jp', 'us', 'visa-free', 90, 'Japanese citizens can visit the US for up to 90 days without a visa under the Visa Waiver Program (ESTA required).'),
('jp', 'ca', 'visa-free', 180, 'Japanese citizens can visit Canada for up to 6 months without a visa (eTA required).'),
('jp', 'gb', 'visa-free', 180, 'Japanese citizens can visit the UK for up to 6 months without a visa.'),
('jp', 'cn', 'visa-required', NULL, 'Japanese citizens need a visa to visit China.'),
('jp', 'in', 'evisa', 60, 'Japanese citizens can apply for an eVisa to visit India for up to 60 days.'),
('jp', 'au', 'eta', 90, 'Japanese citizens need an Electronic Travel Authorization to visit Australia for up to 90 days.')
ON CONFLICT (nationality, destination) DO UPDATE
SET requirement = EXCLUDED.requirement,
    stay_duration = EXCLUDED.stay_duration,
    notes = EXCLUDED.notes;

-- Australia
INSERT INTO public.visa_requirements (nationality, destination, requirement, stay_duration, notes)
VALUES 
('au', 'us', 'visa-free', 90, 'Australian citizens can visit the US for up to 90 days without a visa under the Visa Waiver Program (ESTA required).'),
('au', 'ca', 'visa-free', 180, 'Australian citizens can visit Canada for up to 6 months without a visa (eTA required).'),
('au', 'gb', 'visa-free', 180, 'Australian citizens can visit the UK for up to 6 months without a visa.'),
('au', 'cn', 'visa-required', NULL, 'Australian citizens need a visa to visit China.'),
('au', 'in', 'evisa', 60, 'Australian citizens can apply for an eVisa to visit India for up to 60 days.'),
('au', 'jp', 'visa-free', 90, 'Australian citizens can visit Japan for up to 90 days without a visa.')
ON CONFLICT (nationality, destination) DO UPDATE
SET requirement = EXCLUDED.requirement,
    stay_duration = EXCLUDED.stay_duration,
    notes = EXCLUDED.notes;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS visa_requirements_nationality_idx ON public.visa_requirements(nationality);
CREATE INDEX IF NOT EXISTS visa_requirements_destination_idx ON public.visa_requirements(destination);
CREATE INDEX IF NOT EXISTS visa_requirements_nat_dest_idx ON public.visa_requirements(nationality, destination); 