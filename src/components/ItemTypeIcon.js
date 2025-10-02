import React, { useState, useEffect } from 'react';
import { getItemTypeIcon } from '../utils/assetManager';

const ItemTypeIcon = ({ 
  type, 
  size = 'medium',
  showTooltip = true,
  className = '',
  onClick = null
}) => {
  const [iconPath, setIconPath] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!type) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Get icon path
    const path = getItemTypeIcon(type);
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
        console.warn(`Failed to load item type icon: ${path}`);
      };
      img.src = path;
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [type]);

  // Size classes
  const sizeClasses = {
    'xs': 'w-4 h-4',
    'sm': 'w-6 h-6',
    'medium': 'w-8 h-8',
    'lg': 'w-12 h-12',
    'xl': 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  // Type labels for tooltips
  const typeLabels = {
    'rp': 'Research Points',
    'research_points': 'Research Points',
    'crp': 'Convertible RP',
    'convertible_research_points': 'Convertible RP',
    'convertible_rp': 'Convertible RP',
    'eagles': 'Golden Eagles',
    'golden_eagles': 'Golden Eagles',
    'warpoints': 'Silver Lions',
    'silver_lions': 'Silver Lions',
    'sl': 'Silver Lions'
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
        title={showTooltip ? `No icon found for: ${type}` : undefined}
        onClick={onClick}
      >
        {type === 'rp' || type === 'research_points' ? '📚' : 
         type === 'crp' || type === 'convertible_research_points' || type === 'convertible_rp' ? '🔄' :
         type === 'eagles' || type === 'golden_eagles' ? '🦅' : '💰'}
      </div>
    );
  }

  // Success state
  return (
    <img
      src={iconPath}
      alt={`${type} icon`}
      className={`${sizeClasses[size]} object-contain ${className}`}
      title={showTooltip ? typeLabels[type] || type : undefined}
      onClick={onClick}
      onError={() => {
        setHasError(true);
        console.warn(`Failed to display item type icon: ${iconPath}`);
      }}
    />
  );
};

export default ItemTypeIcon;
