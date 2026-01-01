'use client';

import { useState, useEffect, useMemo } from 'react';
import { ProductService } from '@/lib/data/products';
import { ProductFilters, ProductSearchResult } from '@/types';
import ProductCard from './ProductCard';
import ProductFiltersComponent from './ProductFilters';
import SearchBar from './SearchBar';

interface ProductCatalogProps {
  initialCategory?: 'traditional' | 'modern' | 'designer';
  showFilters?: boolean;
  showSearch?: boolean;
  limit?: number;
}

export default function ProductCatalog({ 
  initialCategory, 
  showFilters = true, 
  showSearch = true,
  limit = 20 
}: ProductCatalogProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    category: initialCategory
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name' | 'newest'>('newest');

  // Fetch products based on current filters and search
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let result: ProductSearchResult;

      if (searchQuery.trim()) {
        // If there's a search query, use search function
        result = await ProductService.searchProducts(searchQuery, limit);
      } else {
        // Otherwise use regular filtering
        result = await ProductService.getProducts(filters, limit);
      }

      setProducts(result.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch products when filters or search changes
  useEffect(() => {
    fetchProducts();
  }, [filters, searchQuery, limit]);

  // Sort products based on selected sort option
  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const handleFilterChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
  };

  if (loading) {
    return (
      <div className="container mx-auto container-mobile py-responsive">
        <div className="grid grid-responsive-1-2-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto container-mobile py-responsive">
        <div className="text-center px-4">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-responsive-base font-medium text-gray-900 mb-2">Error Loading Products</h3>
          <p className="text-gray-600 mb-4 text-responsive-sm">{error}</p>
          <button
            onClick={fetchProducts}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors focus-ring text-responsive-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto container-mobile py-responsive">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-responsive-2xl font-bold text-gray-900 mb-2">
          Silver Mangalsutra Collection
        </h1>
        <p className="text-gray-600 text-responsive-sm">
          Discover our exquisite collection of traditional and modern silver mangalsutra designs
        </p>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4 sm:mb-6">
          <SearchBar
            onSearch={handleSearchChange}
            placeholder="Search for mangalsutra designs..."
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-8">
              <ProductFiltersComponent
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Sort and Results Count */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div className="text-responsive-xs text-gray-600">
              {searchQuery ? (
                <span>
                  {sortedProducts.length} results for "{searchQuery}"
                </span>
              ) : (
                <span>
                  {sortedProducts.length} products
                  {filters.category && ` in ${filters.category}`}
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="sort" className="text-responsive-xs font-medium text-gray-700 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                className="flex-1 sm:flex-none border border-gray-300 rounded-md px-3 py-2 text-responsive-xs focus-ring bg-white min-w-0"
              >
                <option value="newest">Newest First</option>
                <option value="name">Name A-Z</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-responsive-1-2-4 gap-4 sm:gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-responsive-base font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4 text-responsive-sm">
                {searchQuery 
                  ? `No products match your search for "${searchQuery}"`
                  : 'No products match your current filters'
                }
              </p>
              {(searchQuery || Object.keys(filters).some(key => filters[key as keyof ProductFilters])) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ category: initialCategory });
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium text-responsive-sm focus-ring rounded-md px-2 py-1"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}