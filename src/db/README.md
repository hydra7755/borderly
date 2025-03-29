# Visa Requirements Database Setup

This directory contains SQL scripts to set up the database structure for the TravelScore application.

## Setting up the Visa Requirements Table

To set up the visa requirements table in your Supabase project, follow these steps:

1. Log in to your [Supabase Dashboard](https://app.supabase.com/).
2. Select your project.
3. Navigate to the SQL Editor.
4. Create a new query.
5. Copy and paste the contents of `visa_requirements.sql` into the SQL editor.
6. Run the query.

This will:
- Create the `visa_requirements` table if it doesn't exist
- Set up the necessary Row Level Security (RLS) policies
- Populate the table with sample visa requirement data for several countries
- Create indexes for better query performance

## Table Structure

The `visa_requirements` table has the following structure:

| Column         | Type                    | Description                                   |
|----------------|-------------------------|-----------------------------------------------|
| id             | SERIAL (PRIMARY KEY)    | Unique identifier                            |
| nationality    | VARCHAR(2)              | ISO country code of the passport holder      |
| destination    | VARCHAR(2)              | ISO country code of the destination country  |
| requirement    | VARCHAR(20)             | Type of visa requirement                     |
| stay_duration  | INTEGER                 | Maximum stay duration in days (if applicable)|
| notes          | TEXT                    | Additional notes about the visa requirement  |
| created_at     | TIMESTAMP WITH TIME ZONE| Creation timestamp                          |

## Visa Requirement Types

The `requirement` column can have the following values:

- `visa-free`: No visa is required for entry
- `visa-on-arrival`: Visa can be obtained upon arrival at the destination
- `evisa`: Electronic visa is required and can be obtained online
- `eta`: Electronic Travel Authorization is required
- `visa-required`: Traditional visa application is required
- `not-applicable`: No visa is needed (e.g., traveling within your own country)

## Adding More Data

To add more visa requirement data to the table, you can use the following SQL template:

```sql
INSERT INTO public.visa_requirements (nationality, destination, requirement, stay_duration, notes)
VALUES 
('xx', 'yy', 'visa-free', 90, 'Notes about the requirement')
ON CONFLICT (nationality, destination) DO UPDATE
SET requirement = EXCLUDED.requirement,
    stay_duration = EXCLUDED.stay_duration,
    notes = EXCLUDED.notes;
```

Replace:
- `xx` with the ISO country code of the nationality
- `yy` with the ISO country code of the destination
- `visa-free` with the appropriate requirement type
- `90` with the stay duration in days (or NULL if not applicable)
- Notes with relevant information about the visa requirement

The `ON CONFLICT` clause ensures that if an entry already exists for the nationality-destination pair, it will be updated rather than causing an error.

## Troubleshooting

If you encounter any issues with the SQL script:

1. Check that you have the appropriate permissions in your Supabase project.
2. Ensure that there are no conflicting table names in your database.
3. If you need to start fresh, you can drop the table first with:
   ```sql
   DROP TABLE IF EXISTS public.visa_requirements;
   ``` 