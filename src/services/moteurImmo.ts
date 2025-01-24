import { createClient } from '@supabase/supabase-js';
import { Property } from '../types';

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
}

export async function searchProperties(params: SearchParams): Promise<Property[]> {
  try {
    let query = supabase
      .from('real_estate_ads')
      .select(`
        *,
        publisher:publisher_id(*),
        location:location_id(*),
        pictures(*),
        options(*)
      `);

    // Apply filters
    if (params.city) {
      query = query.eq('location.city', params.city);
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

    if (params.propertyType?.length) {
      query = query.in('type', params.propertyType);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Transform the data to match our Property interface
    return data.map(ad => ({
      id: ad.id.toString(),
      title: ad.title || '',
      type: mapPropertyType(ad.type),
      price: ad.price || 0,
      area: ad.surface || 0,
      rooms: ad.building_floors || 1,
      location: {
        city: ad.location?.city || '',
        region: ad.location?.region_code || '',
        address: ad.location?.address || ''
      },
      images: ad.pictures?.map(p => p.picture_url) || [ad.picture_url],
      monthlyRent: calculateMonthlyRent(ad.price),
      expenses: {
        monthlyCharges: calculateMonthlyCharges(ad.surface),
        propertyTax: calculatePropertyTax(ad.price),
        insurance: calculateInsurance(ad.price)
      },
      metrics: {
        pricePerSqm: ad.price_per_square_meter || 0,
        grossYield: calculateGrossYield(ad.price, calculateMonthlyRent(ad.price)),
        netYield: calculateNetYield(ad.price, calculateMonthlyRent(ad.price), ad.surface),
        netYieldWithLoan: 0, // Calculated on the client side
        cashflow: 0, // Calculated on the client side
        annualCashflow: 0, // Calculated on the client side
        cashflowYield: 0, // Calculated on the client side
        monthlyLoanPayment: 0 // Calculated on the client side
      },
      marketIndicators: {
        unemploymentRate: 8.5, // Default values - could be fetched from another source
        populationGrowth: 1.2,
        averageIncome: 35000,
        rentalTension: 0.92
      },
      createdAt: ad.creation_date || new Date().toISOString()
    }));

  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

// Helper functions
function mapPropertyType(type: string): 'house' | 'apartment' | 'building' | 'land' {
  if (type?.toLowerCase().includes('maison')) return 'house';
  if (type?.toLowerCase().includes('appartement')) return 'apartment';
  if (type?.toLowerCase().includes('immeuble')) return 'building';
  return 'land';
}

function calculateMonthlyRent(price: number): number {
  return Math.round((price * 0.05) / 12); // Estimate 5% annual yield
}

function calculateMonthlyCharges(surface: number): number {
  return Math.round(surface * 3); // Estimate 3€/m²/month
}

function calculatePropertyTax(price: number): number {
  return Math.round(price * 0.01); // Estimate 1% of property value
}

function calculateInsurance(price: number): number {
  return Math.round(price * 0.001); // Estimate 0.1% of property value
}

function calculateGrossYield(price: number, monthlyRent: number): number {
  return +((monthlyRent * 12 / price) * 100).toFixed(2);
}

function calculateNetYield(price: number, monthlyRent: number, surface: number): number {
  const annualRent = monthlyRent * 12;
  const annualCharges = calculateMonthlyCharges(surface) * 12;
  const propertyTax = calculatePropertyTax(price);
  const insurance = calculateInsurance(price);
  return +((annualRent - annualCharges - propertyTax - insurance) / price * 100).toFixed(2);
}