/*
  # Create properties table

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `title` (text)
      - `type` (text)
      - `price` (integer)
      - `area` (integer)
      - `rooms` (integer)
      - `location` (jsonb)
      - `images` (text[])
      - `monthly_rent` (integer)
      - `expenses` (jsonb)
      - `metrics` (jsonb)
      - `market_indicators` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `properties` table
    - Add policy for authenticated users to read all properties
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
CREATE INDEX IF NOT EXISTS properties_location_city_idx ON properties USING gin ((location->>'city'));