/*
  # Create properties view

  Creates a view that transforms real_estate_ads data into the format expected by the frontend.
  
  1. New View
    - `properties_view` - Transforms real_estate_ads into properties format
  
  2. Security
    - Enable RLS on the view
    - Add policy for authenticated users to read all properties
*/

CREATE OR REPLACE VIEW properties AS
SELECT 
  ad.adid::uuid as id,
  ad.title,
  CASE 
    WHEN ad.type ILIKE '%maison%' THEN 'house'::property_type
    WHEN ad.type ILIKE '%appartement%' THEN 'apartment'::property_type
    WHEN ad.type ILIKE '%immeuble%' THEN 'building'::property_type
    ELSE 'land'::property_type
  END as type,
  ad.price::integer,
  ad.surface::integer as area,
  COALESCE(
    (ad.options->>'rooms')::integer,
    GREATEST(1, FLOOR(ad.surface::numeric / 25)::integer)
  ) as rooms,
  jsonb_build_object(
    'city', ad.location->>'city',
    'region', ad.location->>'region',
    'address', ad.location->>'address'
  ) as location,
  ARRAY[ad.pictureurl] as images,
  COALESCE(
    (ad.options->>'rent')::integer,
    (ad.price * 0.05 / 12)::integer
  ) as monthly_rent,
  jsonb_build_object(
    'monthlyCharges', COALESCE((ad.options->>'charges')::integer, (ad.surface::numeric * 3)::integer),
    'propertyTax', (ad.price * 0.01)::integer,
    'insurance', (ad.price * 0.001)::integer
  ) as expenses,
  jsonb_build_object(
    'pricePerSqm', ad.pricePerSquareMeter::integer,
    'grossYield', ((COALESCE((ad.options->>'rent')::numeric, ad.price * 0.05) * 12) / ad.price * 100)::numeric(5,2),
    'netYield', ((COALESCE((ad.options->>'rent')::numeric, ad.price * 0.05) * 12 - 
                 (COALESCE((ad.options->>'charges')::numeric, ad.surface * 3) * 12 + 
                  ad.price * 0.011)) / ad.price * 100)::numeric(5,2),
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
  ad.creationdate as created_at
FROM real_estate_ads ad;

-- Enable RLS on the view
ALTER VIEW properties SECURITY INVOKER;

-- Create policy for the view
CREATE POLICY "Allow reading all properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);