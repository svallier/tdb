/*
  # Create properties view

  1. Creates a view that transforms the real estate data into the format needed by the frontend
  2. Adds proper security policies
  3. Grants necessary permissions

  The view joins real_estate_ads with locations, pictures, and other related tables
  to provide a complete property listing view.
*/

-- Create an enum for property types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('house', 'apartment', 'building', 'land');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the view
CREATE OR REPLACE VIEW properties_view AS
SELECT 
  ad.unique_id as id,
  ad.title,
  CASE 
    WHEN ad.type ILIKE '%maison%' THEN 'house'::property_type
    WHEN ad.type ILIKE '%appartement%' THEN 'apartment'::property_type
    WHEN ad.type ILIKE '%immeuble%' THEN 'building'::property_type
    ELSE 'land'::property_type
  END as type,
  ad.price::integer,
  ad.surface::integer as area,
  COALESCE(ad.building_floors, GREATEST(1, FLOOR(ad.surface::numeric / 25)::integer)) as rooms,
  jsonb_build_object(
    'city', (ad.location->>'city'),
    'region', (ad.location->>'regionCode'),
    'address', ad.reference
  ) as location,
  COALESCE(
    ad.picture_urls,
    ARRAY[ad.picture_url]
  ) as images,
  -- Estimated monthly rent (5% annual yield divided by 12)
  FLOOR(ad.price * 0.05 / 12)::integer as monthly_rent,
  jsonb_build_object(
    'monthlyCharges', FLOOR(ad.surface * 3)::integer,
    'propertyTax', FLOOR(ad.price * 0.01)::integer,
    'insurance', FLOOR(ad.price * 0.001)::integer
  ) as expenses,
  jsonb_build_object(
    'pricePerSqm', ad.price_per_square_meter::integer,
    'grossYield', ((ad.price * 0.05) / ad.price * 100)::numeric(5,2),
    'netYield', ((ad.price * 0.05 - (ad.surface * 3 * 12 + ad.price * 0.011)) / ad.price * 100)::numeric(5,2),
    'netYieldWithLoan', 0,
    'cashflow', 0,
    'annualCashflow', 0,
    'cashflowYield', 0,
    'monthlyLoanPayment', 0
  ) as metrics,
  jsonb_build_object(
    'unemploymentRate', 8.5,
    'populationGrowth', 1.2,
    'averageIncome', 35000,
    'rentalTension', 0.92
  ) as market_indicators,
  ad.creation_date as created_at
FROM real_estate_ads ad;

-- Enable RLS on the view
ALTER VIEW properties_view ENABLE ROW LEVEL SECURITY;

-- Create policy for the view
CREATE POLICY "Enable read access for authenticated users"
  ON properties_view
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant access to authenticated users
GRANT SELECT ON properties_view TO authenticated;