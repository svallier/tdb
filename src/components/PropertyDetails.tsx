import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { getPropertyById } from '../services/moteurImmo';
import { ArrowLeft, Euro, MapPin, Home, Grid, TrendingUp, Users, Building2, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { calculatePropertyScore } from '../utils/propertyScoring';

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Load favorites from localStorage
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (property) {
      setIsFavorite(favorites.some((fav: Property) => fav.id === property.id));
    }
  }, [property]);

  const handleToggleFavorite = () => {
    if (!property) return;
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter((fav: Property) => fav.id !== property.id);
    } else {
      newFavorites = [...favorites, property];
    }
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  useEffect(() => {
    async function fetchProperty() {
      if (!id) return;
      
      try {
        const data = await getPropertyById(id);
        setProperty(data);
      } catch (err) {
        setError('Erreur lors du chargement de la propriété');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Propriété non trouvée'}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  const score = calculatePropertyScore(
    property.metrics?.netYield || 0,
    property.market_indicators?.rental_tension || 0.9,
    property.type,
    property.location.city
  );

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === (Array.isArray(property.images) ? property.images.length : 1) - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (Array.isArray(property.images) ? property.images.length : 1) - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la recherche
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column - Images and basic info */}
          <div>
            {/* Image gallery */}
            <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-6">
              <img
                src={Array.isArray(property.images) ? property.images[currentImageIndex] : property.images}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              {Array.isArray(property.images) && property.images.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {Array.isArray(property.images) ? property.images.length : 1}
                  </div>
                </>
              )}
            </div>

            {/* Basic info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{property.location?.address || property.location?.city || 'Adresse non disponible'}</span>
                    </div>
                    <button
                      onClick={handleToggleFavorite}
                      className={`p-2 rounded-full transition-colors ${
                        isFavorite 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className={`${score.color} text-white text-lg font-bold px-3 py-1 rounded`}>
                  {score.score}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Euro className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-bold text-xl text-gray-900">
                      {(property.price || 0).toLocaleString()}€
                    </div>
                    <div className="text-sm text-gray-500">
                      {(property.metrics?.pricePerSqm || 0).toLocaleString()}€/m²
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-bold text-xl text-gray-900">
                      {property.type || 'Non spécifié'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {property.area || 0}m² • {property.rooms || 0} pièces
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="font-semibold text-gray-900 mb-4">Caractéristiques</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{property.rooms || 0} pièces</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{property.area || 0}m²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Financial info and market data */}
          <div className="space-y-6">
            {/* Financial metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Analyse financière</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Loyer mensuel</span>
                  </div>
                  <span className="font-medium">{(property.monthly_rent || 0).toLocaleString()}€</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Charges mensuelles</span>
                  </div>
                  <span className="font-medium text-gray-600">
                    {(property.expenses?.monthlyCharges || 0).toLocaleString()}€
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Taxe foncière</span>
                  </div>
                  <span className="font-medium text-gray-600">
                    {(property.expenses?.propertyTax || 0).toLocaleString()}€/an
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Rendement brut</span>
                  </div>
                  <span className="font-medium text-blue-600">
                    {property.metrics?.grossYield || 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Rendement net</span>
                  </div>
                  <span className="font-medium text-blue-600">
                    {property.metrics?.netYield || 0}%
                  </span>
                </div>

                {(property.metrics?.monthlyLoanPayment || 0) > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Mensualité crédit</span>
                      </div>
                      <span className="font-medium text-gray-600">
                        {(property.metrics?.monthlyLoanPayment || 0).toLocaleString()}€
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Cashflow mensuel</span>
                      <span className={`font-medium ${
                        (property.metrics?.cashflow || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(property.metrics?.cashflow || 0) > 0 ? '+' : ''}
                        {(property.metrics?.cashflow || 0).toLocaleString()}€
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Market indicators */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Indicateurs de marché</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Tension locative</span>
                  </div>
                  <span className="font-medium">
                    {((property.market_indicators?.rental_tension || 0.9) * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Croissance démographique</span>
                  </div>
                  <span className="font-medium">
                    +{property.market_indicators?.populationGrowth || 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Revenu moyen</span>
                  </div>
                  <span className="font-medium">
                    {(property.market_indicators?.averageIncome || 0).toLocaleString()}€
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}