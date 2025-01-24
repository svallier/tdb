export interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  area: number;
  rooms: number;
  location: {
    city: string;
    region: string;
    address?: string;
  };
  images: string[];
  monthly_rent?: number;
  expenses?: {
    monthlyCharges: number;
    propertyTax: number;
    insurance: number;
  };
  metrics?: {
    pricePerSqm: number;
    grossYield: number;
    netYield: number;
    netYieldWithLoan: number;
    cashflow: number;
    annualCashflow: number;
    cashflowYield: number;
    monthlyLoanPayment: number;
  };
  market_indicators?: {
    unemploymentRate: number;
    populationGrowth: number;
    averageIncome: number;
    rental_tension: number;
  };
  createdAt: string;
}

export type ExpenseType = 'monthlyCharges' | 'propertyTax' | 'insurance';
export type ScoreType = 'A' | 'B' | 'C' | 'D';

export interface FilterState {
  city: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  minCashflow: number;
  maxCashflow: number;
  propertyType: string[];
  minGrossYield: number;
  maxGrossYield: number;
  minRooms: number;
  loanAmount: number;
  downPayment: number;
  includedExpenses: ExpenseType[];
  minScore?: ScoreType;
}