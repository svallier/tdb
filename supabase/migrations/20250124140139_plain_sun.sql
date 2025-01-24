/*
  # Create properties view with materialized view

  1. Creates a materialized view for better performance and security
  2. Properly joins with the pictures table for image URLs
  3. Adds security through grants instead of RLS
*/

-- Create an enum for property types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('house', 'apartment', 'building', 'land');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create a materialized view instead of a regular view for better performance
CREATE MATERIALIZED VIEW properties_view AS
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
    'city', l.city,
    'region', l.region_code,
    'address', ad.reference
  ) as location,
  ARRAY(
    SELECT p.picture_url 
    FROM pictures p 
    WHERE p.ad_id = ad.id
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
FROM real_estate_ads ad
LEFT JOIN locations l ON l.id = ad.location_id;

-- Create indexes on the materialized view for better query performance
CREATE INDEX idx_properties_view_id ON properties_view (id);
CREATE INDEX idx_properties_view_type ON properties_view (type);
CREATE INDEX idx_properties_view_price ON properties_view ((location->>'city'));
CREATE INDEX idx_properties_view_area ON properties_view (area);
CREATE INDEX idx_properties_view_rooms ON properties_view (rooms);

-- Grant access to authenticated users
GRANT SELECT ON properties_view TO authenticated;

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_properties_view()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY properties_view;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the view when underlying tables change
CREATE TRIGGER refresh_properties_view_on_ads
AFTER INSERT OR UPDATE OR DELETE ON real_estate_ads
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_properties_view();

CREATE TRIGGER refresh_properties_view_on_locations
AFTER INSERT OR UPDATE OR DELETE ON locations
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_properties_view();