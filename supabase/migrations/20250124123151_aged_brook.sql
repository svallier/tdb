/*
  # Initial schema setup for properties

  1. New Types
    - Create property_type enum for categorizing properties

  2. Tables
    - Create properties table with all necessary columns
    - Add appropriate indexes for performance

  3. Security
    - Enable RLS
    - Add policy for authenticated users to read properties
*/

-- Create enum for property types
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'building', 'land');

-- Create the properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type property_type NOT NULL,
  price integer NOT NULL,
  area integer NOT NULL,
  rooms integer NOT NULL,
  location jsonb NOT NULL,
  images text[] NOT NULL,
  monthly_rent integer NOT NULL,
  expenses jsonb NOT NULL,
  metrics jsonb NOT NULL,
  market_indicators jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading all properties
CREATE POLICY "Allow reading all properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS properties_type_idx ON properties (type);
CREATE INDEX IF NOT EXISTS properties_price_idx ON properties (price);
CREATE INDEX IF NOT EXISTS properties_area_idx ON properties (area);
CREATE INDEX IF NOT EXISTS properties_rooms_idx ON properties (rooms);

-- Create GIN index for JSONB location data using jsonb_path_ops
CREATE INDEX IF NOT EXISTS properties_location_gin_idx 
  ON properties USING gin (location jsonb_path_ops);

-- Create a btree index on the city field extracted from location
CREATE INDEX IF NOT EXISTS properties_location_city_idx 
  ON properties ((location->>'city'));