'use client';

import { useState } from 'react';
import { ProductFilters as ProductFiltersType } from '@/types';

interface ProductFiltersProps {
  filters: ProductFiltersType;
  onFilterChange: (filters: ProductFiltersType) => void;
}

export default function ProductFilters({ filters, onFilterChange }: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice?.toString() || '',
    max: filters.maxPrice?.toString() || ''
  });

  const handlePriceRangeChange = (field: 'min' | 'max', value: string) => {
    setPriceRange(prev => ({ ...prev, [field]: value }));
    
    // Apply filter when user stops typing (debounced)
    const numValue = value ? parseFloat(value) : undefined;
    if (field === 'min') {
      onFilterChange({
        ...filters,
        minPrice: numValue
      });
    } else {
      onFilterChange({
        ...filters,
        maxPrice: numValue
      });
    }
  };

  const handleStockFilterChange = (inStock: boolean | undefined) => {
    onFilterChange({
      ...filters,
      inStock
    });
  };

  const clearAllFilters = () => {
    setPriceRange({ min: '', max: '' });
    onFilterChange({});
  };

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.inStock;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Price Range Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label htmlFor="min-price" className="sr-only">Minimum price</label>
                <input
                  type="number"
                  id="min-price"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <span className="text-gray-500">to</span>
              <div className="flex-1">
                <label htmlFor="max-price" className="sr-only">Maximum price</label>
                <input
                  type="number"
                  id="max-price"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Quick Price Ranges */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Under ₹5K', min: 0, max: 5000 },
                { label: '₹5K - ₹10K', min: 5000, max: 10000 },
                { label: '₹10K - ₹20K', min: 10000, max: 20000 },
                { label: 'Above ₹20K', min: 20000, max: undefined }
              ].map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    setPriceRange({
                      min: range.min.toString(),
                      max: range.max?.toString() || ''
                    });
                    onFilterChange({
                      ...filters,
                      minPrice: range.min,
                      maxPrice: range.max
                    });
                  }}
                  className={`px-3 py-2 text-xs border rounded-md transition-colors ${
                    filters.minPrice === range.min && filters.maxPrice === range.max
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Availability Filter */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Availability</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="availability"
                checked={filters.inStock === undefined}
                onChange={() => handleStockFilterChange(undefined)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">All Products</span>
            </label>
            {/* <label className="flex items-center">
              <input
                type="radio"
                name="availability"
                checked={filters.inStock === true}
                onChange={() => handleStockFilterChange(true)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
            </label> */}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {(filters.minPrice || filters.maxPrice) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ₹{filters.minPrice || 0} - ₹{filters.maxPrice || '∞'}
                  <button
                    onClick={() => {
                      setPriceRange({ min: '', max: '' });
                      onFilterChange({
                        ...filters,
                        minPrice: undefined,
                        maxPrice: undefined
                      });
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {/* {filters.inStock && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  In Stock
                  <button
                    onClick={() => handleStockFilterChange(undefined)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )} */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}