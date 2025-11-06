import React from 'react';
import { SearchableCountrySelector } from './SearchableCountrySelector';

export interface CountrySelectorProps {
  readonly className?: string;
}

/**
 * CountrySelector - Now uses the searchable implementation for better UX
 * with 195+ countries. The component provides predictive search to help
 * users quickly find their country.
 */
export const CountrySelector: React.FC<CountrySelectorProps> = ({ className }) => {
  return (
    <SearchableCountrySelector 
      className={className ?? 'w-[240px]'} 
      placeholder="Select your country"
    />
  );
};

export default CountrySelector;
