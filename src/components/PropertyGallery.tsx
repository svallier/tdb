import React from 'react';
import { Property } from '../types';
import { PropertyCard } from './PropertyCard';

interface PropertyGalleryProps {
  properties: Property[];
  onPropertyClick: (id: string) => void;
}

export function PropertyGallery({ properties, onPropertyClick }: PropertyGalleryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onClick={onPropertyClick}
        />
      ))}
    </div>
  );
}