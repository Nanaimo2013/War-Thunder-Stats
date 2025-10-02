import React, { useState, useEffect } from 'react';
import { getVehicleIcon, extractVehicleInfo } from '../utils/assetManager';

const VehicleIcon = ({ 
  vehicleName, 
  country = null, 
  rank = null, 
  type = null, 
  size = 'medium',
  showTooltip = true,
  className = '',
  onClick = null
}) => {
  const [iconPath, setIconPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState(null);

  useEffect(() => {
    if (!vehicleName) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Extract vehicle information
    const info = extractVehicleInfo(vehicleName);
    setVehicleInfo(info);

    // Get icon path
    const path = getVehicleIcon(vehicleName, country, rank, type);
    setIconPath(path);

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
        console.warn(`Failed to load vehicle icon: ${path}`);
      };
      img.src = path;
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [vehicleName, country, rank, type]);

  // Size classes
  const sizeClasses = {
    'xs': 'w-4 h-4',
    'sm': 'w-6 h-6',
    'medium': 'w-8 h-8',
    'lg': 'w-12 h-12',
    'xl': 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-700 rounded animate-pulse ${className}`}>
        <div className="w-full h-full bg-gray-600 rounded"></div>
      </div>
    );
  }

  // Error state - show fallback icon
  if (hasError || !iconPath) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-gray-800 border border-gray-600 rounded flex items-center justify-center text-gray-400 text-xs ${className}`}
        title={showTooltip ? `No icon found for: ${vehicleName}` : undefined}
        onClick={onClick}
      >
        {vehicleInfo?.type === 'aviation' ? '✈️' : '🛡️'}
      </div>
    );
  }

  // Success state
  return (
    <img
      src={iconPath}
      alt={`${vehicleName} icon`}
      className={`${sizeClasses[size]} object-contain ${className}`}
      title={showTooltip ? `${vehicleName} (${vehicleInfo?.country || 'Unknown'}, Rank ${vehicleInfo?.rank || 'Unknown'})` : undefined}
      onClick={onClick}
      onError={() => {
        setHasError(true);
        console.warn(`Failed to display vehicle icon: ${iconPath}`);
      }}
    />
  );
};

export default VehicleIcon;
