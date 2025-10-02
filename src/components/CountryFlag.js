import React, { useState, useEffect } from 'react';
import { getCountryFlag } from '../utils/assetManager';

const CountryFlag = ({ 
  country, 
  size = 'medium',
  showTooltip = true,
  className = '',
  onClick = null
}) => {
  const [flagPath, setFlagPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!country) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Get flag path
    const path = getCountryFlag(country);
    setFlagPath(path);

    // Test if image loads
    if (path) {
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        setHasError(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setHasError(true);
        console.warn(`Failed to load country flag: ${path}`);
      };
      img.src = path;
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [country]);

  // Size classes
  const sizeClasses = {
    'xs': 'w-4 h-3',
    'sm': 'w-6 h-4',
    'medium': 'w-8 h-6',
    'lg': 'w-12 h-8',
    'xl': 'w-16 h-12',
    '2xl': 'w-20 h-15'
  };

  // Country labels for tooltips
  const countryLabels = {
    'usa': 'United States',
    'germany': 'Germany',
    'ussr': 'Soviet Union',
    'japan': 'Japan',
    'china': 'China',
    'france': 'France',
    'italy': 'Italy',
    'sweden': 'Sweden',
    'israel': 'Israel'
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-700 rounded animate-pulse ${className}`}>
        <div className="w-full h-full bg-gray-600 rounded"></div>
      </div>
    );
  }

  // Error state - show fallback
  if (hasError || !flagPath) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-gray-800 border border-gray-600 rounded flex items-center justify-center text-gray-400 text-xs ${className}`}
        title={showTooltip ? `No flag found for: ${country}` : undefined}
        onClick={onClick}
      >
        🏳️
      </div>
    );
  }

  // Success state
  return (
    <img
      src={flagPath}
      alt={`${country} flag`}
      className={`${sizeClasses[size]} object-cover rounded shadow-sm ${className}`}
      title={showTooltip ? countryLabels[country] || country : undefined}
      onClick={onClick}
      onError={() => {
        setHasError(true);
        console.warn(`Failed to display country flag: ${flagPath}`);
      }}
    />
  );
};

export default CountryFlag;
