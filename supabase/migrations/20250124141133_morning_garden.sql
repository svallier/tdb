/*
  # Fix database schema for property details

  1. Tables
    - Create publishers table
    - Create locations table
    - Create pictures table
    - Create options table
    - Add foreign key relationships

  2. Changes
    - Add missing columns to real_estate_ads
    - Add proper relationships between tables
    - Add indexes for performance
*/

-- Create publishers table
CREATE TABLE IF NOT EXISTS publishers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  contact_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  city TEXT,
  region_code TEXT,
  address TEXT,
  postal_code TEXT,
  coordinates JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create pictures table
CREATE TABLE IF NOT EXISTS pictures (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES real_estate_ads(id),
  picture_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create options table
CREATE TABLE IF NOT EXISTS options (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES real_estate_ads(id),
  name TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns and foreign keys to real_estate_ads
ALTER TABLE real_estate_ads
ADD COLUMN IF NOT EXISTS publisher_id INTEGER REFERENCES publishers(id),
ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_real_estate_ads_publisher ON real_estate_ads(publisher_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_ads_location ON real_estate_ads(location_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_ads_unique_id ON real_estate_ads(unique_id);
CREATE INDEX IF NOT EXISTS idx_pictures_ad_id ON pictures(ad_id);
CREATE INDEX IF NOT EXISTS idx_options_ad_id ON options(ad_id);

-- Enable RLS on all tables
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pictures ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users on publishers"
  ON publishers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users on locations"
  ON locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users on pictures"
  ON pictures FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users on options"
  ON options FOR SELECT TO authenticated USING (true);

-- Grant access to authenticated users
GRANT SELECT ON publishers TO authenticated;
GRANT SELECT ON locations TO authenticated;
GRANT SELECT ON pictures TO authenticated;
GRANT SELECT ON options TO authenticated;