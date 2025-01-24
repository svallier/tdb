/*
  # Create real estate ads table

  1. New Tables
    - `real_estate_ads`
      - Standard fields for property details
      - JSONB fields for complex data (publisher, location, etc.)
      - Timestamps for tracking
  2. Security
    - Enable RLS
    - Add policy for authenticated users to read data
*/

-- Create the real estate ads table
CREATE TABLE IF NOT EXISTS real_estate_ads (
    id SERIAL PRIMARY KEY,
    publisher JSONB,
    reference TEXT,
    last_modification_date TIMESTAMPTZ,
    title TEXT,
    description TEXT,
    picture_url TEXT,
    picture_urls JSONB,
    position JSONB,
    price NUMERIC,
    price_per_square_meter NUMERIC,
    surface NUMERIC,
    land_surface NUMERIC,
    building_floors INTEGER,
    options JSONB,
    location JSONB,
    origin TEXT,
    ad_id TEXT,
    publication_date TIMESTAMPTZ,
    type TEXT,
    category TEXT,
    url TEXT,
    creation_date TIMESTAMPTZ,
    unique_id TEXT
);

-- Enable RLS
ALTER TABLE real_estate_ads ENABLE ROW LEVEL SECURITY;

-- Create policy for reading data
CREATE POLICY "Enable read access for authenticated users"
    ON real_estate_ads
    FOR SELECT
    TO authenticated
    USING (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_real_estate_ads_type ON real_estate_ads (type);
CREATE INDEX IF NOT EXISTS idx_real_estate_ads_price ON real_estate_ads (price);
CREATE INDEX IF NOT EXISTS idx_real_estate_ads_surface ON real_estate_ads (surface);
CREATE INDEX IF NOT EXISTS idx_real_estate_ads_creation_date ON real_estate_ads (creation_date);