-- Create tables for the Borderly application

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  passport_country TEXT,
  travel_score INTEGER DEFAULT 0
);

-- Countries table
CREATE TABLE countries (
  id TEXT PRIMARY KEY, -- ISO code
  name TEXT NOT NULL,
  region TEXT,
  visa_free_count INTEGER DEFAULT 0,
  visa_on_arrival_count INTEGER DEFAULT 0,
  mobility_score INTEGER DEFAULT 0
);

-- Visa requirements table
CREATE TABLE visa_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passport_country TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'visa_free', 'visa_on_arrival', 'e_visa', 'visa_required'
  max_stay_days INTEGER,
  notes TEXT,
  UNIQUE(passport_country, destination_country)
);

-- User travel history table
CREATE TABLE travel_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  entry_date DATE NOT NULL,
  exit_date DATE,
  purpose TEXT, -- 'tourism', 'business', 'education', 'other'
  notes TEXT
);

-- Contact messages table
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- User can only see and modify their own data
CREATE POLICY "Users can view own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Travel history policies
CREATE POLICY "Users can view own travel history" 
  ON travel_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own travel history" 
  ON travel_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own travel history" 
  ON travel_history FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own travel history" 
  ON travel_history FOR DELETE 
  USING (auth.uid() = user_id);

-- Anyone can insert contact messages
CREATE POLICY "Anyone can insert contact messages" 
  ON contact_messages FOR INSERT 
  WITH CHECK (true);

-- Only admins can view contact messages
CREATE POLICY "Only admins can view contact messages" 
  ON contact_messages FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM users WHERE subscription_tier = 'admin'
  ));

-- Functions
CREATE OR REPLACE FUNCTION calculate_travel_score(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER;
  travel_history_score INTEGER;
  passport_multiplier FLOAT;
  final_score INTEGER;
BEGIN
  -- Get base score from the user's passport country
  SELECT mobility_score INTO base_score
  FROM countries c
  JOIN users u ON u.passport_country = c.id
  WHERE u.id = user_id;
  
  -- Calculate score based on travel history
  SELECT COUNT(DISTINCT country) * 5 INTO travel_history_score
  FROM travel_history
  WHERE user_id = user_id;
  
  -- Calculate final score
  final_score := base_score + travel_history_score;
  
  -- Cap at 1000
  IF final_score > 1000 THEN
    final_score := 1000;
  END IF;
  
  -- Update user's travel score
  UPDATE users
  SET travel_score = final_score,
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN final_score;
END;
$$ LANGUAGE plpgsql; 