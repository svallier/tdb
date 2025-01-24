import React from 'react';
import { useState } from 'react';
import { Property } from '../types';
import { calculatePropertyScore } from '../utils/propertyScoring';
import { Heart, ShoppingCart, TrendingUp, Home, MapPin, Euro, Grid, ChevronLeft, ChevronRight } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onClick: (id: string) => void;
  compact?: boolean;
  loanAmount?: number;
  onAddToCart?: (property: Property) => void;
  isInCart?: boolean;
  onToggleFavorite?: (property: Property) => void;
  isFavorite?: boolean;
  includedExpenses?: {
    monthlyCharges: boolean;
    propertyTax: boolean;
    insurance: boolean;
  };
}

export function PropertyCard({ 
  property, 
  onClick, 
  compact = false, 
  loanAmount = 0,
  onAddToCart,
  isInCart = false,
  onToggleFavorite,
  isFavorite = false,
  includedExpenses = {
    monthlyCharges: true,
    propertyTax: true,
    insurance: true
  }
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (Array.isArray(property.images)) {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (Array.isArray(property.images)) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };
  // Calculer les charges totales en fonction des filtres
  const calculateTotalExpenses = () => {
    let total = 0;
    if (includedExpenses.monthlyCharges) total += property.expenses?.monthlyCharges || 0;
    if (includedExpenses.propertyTax) total += (property.expenses?.propertyTax || 0) / 12;
    if (includedExpenses.insurance) total += (property.expenses?.insurance || 0) / 12;
    return total;
  };

  const monthlyExpenses = calculateTotalExpenses();
  const annualExpenses = monthlyExpenses * 12;
  
  // Ensure all required values exist with fallbacks
  const price = property?.price || 0;
  const monthlyRent = property?.monthly_rent || 0;
  const monthlyLoanPayment = property?.metrics?.monthlyLoanPayment || 0;
  
  // Calculate metrics
  const annualRent = monthlyRent * 12;
  const netYield = price > 0 ? +((annualRent - annualExpenses) / price * 100).toFixed(2) : 0;
  const netYieldWithLoan = price > 0 ? +(((annualRent - annualExpenses - (monthlyLoanPayment * 12)) / price) * 100).toFixed(2) : 0;
  const cashflow = monthlyRent - monthlyExpenses - monthlyLoanPayment;
  const annualCashflow = cashflow * 12;
  const cashflowYield = price > 0 ? +((annualCashflow / price) * 100).toFixed(2) : 0;

  // Utiliser les métriques recalculées
  const effectiveNetYield = loanAmount > 0 ? netYieldWithLoan : netYield;
  const isPositiveCashflow = cashflow > 0;

  const score = calculatePropertyScore(
    property?.metrics?.netYield || 0,
    property?.market_indicators?.rental_tension || 0.9,
    property?.type || 'apartment',
    property?.location?.city || ''
  );

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden ${
        compact ? 'flex' : ''
      }`}
      onClick={() => onClick(property.id)}
    >
      {/* Image */}
      <div 
        className={`relative ${compact ? 'w-48 h-48' : 'h-48'}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img
          src={Array.isArray(property?.images) ? property.images[currentImageIndex] : property?.images || ''}
          alt={property?.title || 'Property image'}
          className="w-full h-full object-cover"
        />
        {Array.isArray(property?.images) && property.images.length > 1 && isHovering && (
          <>
            <button
              onClick={handlePreviousImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 transition-all transform hover:scale-110"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 transition-all transform hover:scale-110"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-0.5 rounded-full text-xs transition-opacity">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(property);
              }}
              className={`p-2 rounded-full ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className="w-4 h-4" />
            </button>
          )}
          {onAddToCart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(property);
              }}
              disabled={isInCart}
              className={`p-2 rounded-full ${
                isInCart
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="absolute top-2 left-2">
          <div className={`${score.color} text-white text-sm font-bold px-2 py-1 rounded`}>
            {score.score}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 ${compact ? 'flex-1' : ''}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{property?.title || 'Property'}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
              <MapPin className="w-4 h-4" />
              <span>{property?.location?.city || 'Unknown location'}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900">{price.toLocaleString()}€</div>
            {property?.metrics?.pricePerSqm && (
              <div className="text-sm text-gray-500">
                {property.metrics.pricePerSqm.toLocaleString()}€/m²
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{property?.type || 'Unknown type'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {property?.area || 0}m² • {property?.rooms || 0}p
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Loyer mensuel</span>
            </div>
            <span className="font-medium">{monthlyRent.toLocaleString()}€</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Charges mensuelles</span>
            </div>
            <span className="font-medium text-gray-600">
              {monthlyExpenses.toLocaleString()}€
            </span>
          </div>

          {loanAmount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Mensualité</span>
              </div>
              <span className="font-medium text-gray-600">
                {monthlyLoanPayment.toLocaleString()}€
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {loanAmount > 0 ? 'Rendement avec prêt' : 'Rendement net'}
              </span>
            </div>
            <span className={`font-medium ${effectiveNetYield >= 6 ? 'text-green-600' : 'text-blue-600'}`}>
              {effectiveNetYield}%
            </span>
          </div>

          {loanAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cashflow mensuel</span>
              <span className={`font-medium ${isPositiveCashflow ? 'text-green-600' : 'text-red-600'}`}>
                {isPositiveCashflow ? '+' : ''}{cashflow.toLocaleString()}€
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}