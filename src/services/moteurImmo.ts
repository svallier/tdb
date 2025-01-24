import { createClient } from '@supabase/supabase-js';
import { Property, ScoreType } from '../types';
import { calculatePropertyScore } from '../utils/propertyScoring';
 
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
 
interface SearchParams {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minRooms?: number;
  propertyType?: string[];
  selectedScores?: ScoreType[];
}

export async function getPropertyById(id: string): Promise<Property> {
  try {
    const { data, error } = await supabase
      .from('real_estate_ads')
      .select(`
        *,
        pictures (
          picture_url
        ),
        location:location_id (
          id,
          city,
          region_code,
          coordinates
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Property not found');

    return transformPropertyData(data);
  } catch (error) {
    console.error('Error fetching property:', error);
    throw error;
  }
}
 
export async function searchProperties(params: SearchParams): Promise<Property[]> {
  try {
    let query = supabase
      .from('real_estate_ads')
      .select(`
        *,
        pictures (
          picture_url
        ),
        location:location_id (
          id,
          city,
          region_code,
          coordinates
        )
      `);
 
    // Apply filters
    if (params.city) {
      query = query.ilike('location.city', `%${params.city}%`);
    }
    if (params.minPrice) {
      query = query.gte('price', params.minPrice);
    }
    if (params.maxPrice) {
      query = query.lte('price', params.maxPrice);
    }
    if (params.minArea) {
      query = query.gte('surface', params.minArea);
    }
    if (params.maxArea) {
      query = query.lte('surface', params.maxArea);
    }
 
    // Filtre sur la catégorie
    if (params.propertyType?.length) {
      const categories = params.propertyType.map(type => {
        switch (type) {
          case 'Maison':
            return 'house';
          case 'Appartement':
            return 'flat';
          case 'Immeuble':
            return 'building';
          case 'Terrain':
            return 'land';
          default:
            return null;
        }
      }).filter(Boolean);
 
      if (categories.length > 0) {
        query = query.in('category', categories);
      }
    }
 
    const { data, error } = await query;
    if (error) throw error;
 
    // Transform the data to match our Property interface
    let properties = data.map(transformPropertyData);
 
    // Filter by selected scores if any
    if (params.selectedScores?.length) {
      properties = properties.filter(property => 
        params.selectedScores?.includes((property as any).score)
      );
    }
 
    return properties;
 
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

function transformPropertyData(ad: any): Property {
  // Collect all available images
  const allImages = [];
  // Add main picture if available
  if (ad.picture_url) {
    allImages.push(ad.picture_url);
  }
  // Add additional pictures if available
  if (ad.pictures && Array.isArray(ad.pictures)) {
    ad.pictures.forEach((pic: { picture_url: string }) => {
      if (pic.picture_url && !allImages.includes(pic.picture_url)) {
        allImages.push(pic.picture_url);
      }
    });
  }

  // If no images are available, use a placeholder
  if (allImages.length === 0) {
    allImages.push('https://via.placeholder.com/800x600?text=No+Image');
  }

  const monthlyRent = calculateMonthlyRent(ad.price);
  const monthlyCharges = calculateMonthlyCharges(ad.surface);
  const propertyTax = calculatePropertyTax(ad.price);
  const insurance = calculateInsurance(ad.price);
  
  // Calcul des rendements selon la nouvelle logique
  const annualRent = monthlyRent * 12;
  const annualCharges = monthlyCharges * 12 + propertyTax + insurance;
  // Rendement brut = (Loyer annuel / Prix) × 100
  const grossYield = +((annualRent / ad.price) * 100).toFixed(2);
  // Rendement net = ((Loyer - Charges) / Prix) × 100
  const netYield = +(((annualRent - annualCharges) / ad.price) * 100).toFixed(2);

  const type = mapPropertyType(ad.category);
  const city = ad.location?.city || '';

  // Parse coordinates from array format
  let coordinates;
  if (ad.location?.coordinates && Array.isArray(ad.location.coordinates)) {
    coordinates = {
      latitude: ad.location.coordinates[1],
      longitude: ad.location.coordinates[0]
    };
  }

  const property: Property = {
    id: ad.id.toString(),
    title: ad.title || '',
    type,
    price: ad.price || 0,
    area: ad.surface || 0,
    rooms: ad.building_floors || 1,
    location: {
      city,
      region: ad.location?.region_code || '',
      address: ad.reference || '',
      coordinates
    },
    images: allImages,
    monthly_rent: monthlyRent,
    expenses: {
      monthlyCharges,
      propertyTax,
      insurance
    },
    metrics: {
      pricePerSqm: ad.price_per_square_meter || Math.round(ad.price / ad.surface),
      grossYield,
      netYield,
      netYieldWithLoan: 0,
      cashflow: monthlyRent - monthlyCharges - (propertyTax / 12) - (insurance / 12),
      annualCashflow: 0,
      cashflowYield: 0,
      monthlyLoanPayment: 0
    },
    market_indicators: {
      unemploymentRate: 8.5,
      populationGrowth: 1.2,
      averageIncome: 35000,
      rental_tension: 0.92
    },
    createdAt: ad.creation_date || new Date().toISOString()
  };

  // Calculate the property score
  const score = calculatePropertyScore(netYield, property.market_indicators.rental_tension, type, city);
  (property as any).score = score.score;

  return property;
}
 
// Helper functions
function mapPropertyType(category: string): string {
  switch (category?.toLowerCase()) {
    case 'house':
      return 'Maison';
    case 'flat':
      return 'Appartement';
    case 'building':
      return 'Immeuble';
    case 'land':
      return 'Terrain';
    default:
      return 'Maison';
  }
}
 
function calculateMonthlyRent(price: number): number {
  return Math.round((price * 0.05) / 12); // 5% rendement annuel estimé
}
 
function calculateMonthlyCharges(surface: number): number {
  return Math.round(surface * 3); // 3€/m²/mois estimé
}
 
function calculatePropertyTax(price: number): number {
  return Math.round(price * 0.01); // 1% de la valeur du bien
}
 
function calculateInsurance(price: number): number {
  return Math.round(price * 0.001); // 0.1% de la valeur du bien
}