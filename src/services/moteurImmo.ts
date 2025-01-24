import { Property } from '../types';

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
    // Construction des paramètres de recherche
    const searchParams = new URLSearchParams();
    
    if (params.city) searchParams.append('ville', params.city);
    if (params.minPrice) searchParams.append('prixMin', params.minPrice.toString());
    if (params.maxPrice) searchParams.append('prixMax', params.maxPrice.toString());
    if (params.minArea) searchParams.append('surfaceMin', params.minArea.toString());
    if (params.maxArea) searchParams.append('surfaceMax', params.maxArea.toString());
    if (params.minRooms) searchParams.append('piecesMin', params.minRooms.toString());
    if (params.propertyType?.length) {
      const types = params.propertyType.map(type => {
        switch (type) {
          case 'house': return 'maison';
          case 'apartment': return 'appartement';
          case 'building': return 'immeuble';
          case 'land': return 'terrain';
          default: return type;
        }
      });
      searchParams.append('types', types.join(','));
    }

    const response = await fetch(`http://localhost:3000/api/properties?${searchParams.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.properties || !Array.isArray(data.properties)) {
      console.error('Unexpected API response:', data);
      throw new Error('Invalid API response format');
    }

    return data.properties.map(mapToProperty);
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

function mapToProperty(apiProperty: any): Property {
  return {
    id: apiProperty.id.toString(),
    title: apiProperty.title,
    type: apiProperty.type,
    price: apiProperty.price,
    area: apiProperty.area,
    rooms: apiProperty.rooms,
    location: {
      city: apiProperty.city,
      region: apiProperty.region,
      address: apiProperty.address
    },
    images: apiProperty.images,
    monthlyRent: apiProperty.monthlyRent,
    expenses: {
      monthlyCharges: apiProperty.monthlyCharges,
      propertyTax: apiProperty.propertyTax,
      insurance: apiProperty.insurance
    },
    metrics: {
      pricePerSqm: apiProperty.pricePerSqm,
      grossYield: apiProperty.grossYield,
      netYield: apiProperty.netYield,
      netYieldWithLoan: apiProperty.netYieldWithLoan,
      cashflow: apiProperty.cashflow,
      annualCashflow: apiProperty.annualCashflow,
      cashflowYield: apiProperty.cashflowYield,
      monthlyLoanPayment: apiProperty.monthlyLoanPayment
    },
    marketIndicators: {
      unemploymentRate: apiProperty.unemploymentRate,
      populationGrowth: apiProperty.populationGrowth,
      averageIncome: apiProperty.averageIncome,
      rentalTension: apiProperty.rentalTension
    },
    createdAt: apiProperty.createdAt
  };
}