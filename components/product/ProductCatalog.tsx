'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductFilters } from '@/types';
import ProductGridCard from './ProductGridCard';
import Pagination from '@/components/ui/Pagination';

interface ProductCatalogProps {
  limit?: number;
  showBestsellers?: boolean; // New prop to show all products as bestsellers
  itemsPerPage?: number; // Items per page for pagination
}

export default function ProductCatalog({
  limit = 24,
  showBestsellers = false,
  itemsPerPage = 12
}: ProductCatalogProps) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified filters - get price filters and search from URL (reactive to changes)
  const filters = useMemo(() => {
    if (showBestsellers) {
      return {}; // No filters for bestsellers - show all products
    }

    const currentFilters: ProductFilters = {};

    // Get price filters from URL
    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) {
      currentFilters.maxPrice = parseInt(maxPrice);
    }

    const minPrice = searchParams.get('minPrice');
    if (minPrice) {
      currentFilters.minPrice = parseInt(minPrice);
    }

    return currentFilters;
  }, [searchParams, showBestsellers]);

  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating' | 'newest' | 'most-relevant'>('most-relevant');
  const [currentPage, setCurrentPage] = useState(1);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);

  // Get search query directly from URL params (reactive to changes)
  const searchQuery = searchParams.get('search') || '';

  // Fetch products based on current filters and search
  const fetchProducts = useCallback(async () => {
    console.log('fetchProducts called with:', { searchQuery, filters, sortBy, limit });
    
    // Prevent multiple simultaneous calls using ref
    if (isLoadingRef.current) {
      console.log('fetchProducts: Already loading, skipping');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      // Build query parameters for API call
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (filters.minPrice !== undefined) {
        params.append('minPrice', filters.minPrice.toString());
      }
      
      if (filters.maxPrice !== undefined) {
        params.append('maxPrice', filters.maxPrice.toString());
      }
      
      if (sortBy) {
        params.append('sortBy', sortBy);
      }
      
      params.append('limit', limit.toString());

      const apiUrl = `/api/products?${params.toString()}`;
      console.log('Making API call to:', apiUrl);

      // Call API route instead of direct service
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      console.log('API response received:', data.data.products.length, 'products');
      setProducts(data.data.products);
    } catch (err) {
      console.error('fetchProducts error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy, limit]);

  // Effect to fetch products when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [filters, searchQuery, sortBy, limit, fetchProducts]);

  // Reset page when search parameters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  // Sort products based on selected sort option (now handled in service)
  const sortedProducts = useMemo(() => {
    // Products are already sorted by the service, but we keep this for client-side sorting if needed
    return products;
  }, [products]);

  // Pagination logic
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const handleSortChange = (newSort: typeof sortBy) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-12 sm:pb-8 lg:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-12 sm:pb-8 lg:pb-10">
        <div className="text-center px-4">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">{error}</p>
          <button
            onClick={fetchProducts}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-12 sm:pb-8 lg:pb-10">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-2 tracking-wide">
              {filters.maxPrice ? `Products Under ₹${filters.maxPrice.toLocaleString()}` : 'Our Collection'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
              {filters.maxPrice 
                ? `Discover beautiful jewelry pieces within your budget of ₹${filters.maxPrice.toLocaleString()}`
                : 'Our most popular and trending jewelry pieces'
              }
            </p>
          </div>
          
          {/* Clear Filters Button */}
          {(filters.maxPrice || filters.minPrice) && (
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  // Update URL to remove price filters
                  const url = new URL(window.location.href);
                  url.searchParams.delete('maxPrice');
                  url.searchParams.delete('minPrice');
                  window.history.pushState({}, '', url.toString());
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - No sidebar for simplified view */}
      <div className="w-full">
        {/* Sort and Results Count - Mobile Optimized */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
          {/* Results Count */}
          <div className="text-sm text-gray-600 order-2 sm:order-1">
            {searchQuery ? (
              <span>
                {sortedProducts.length} results for "{searchQuery}"
              </span>
            ) : (
              <span>
                Showing {paginatedProducts.length} of {sortedProducts.length} items
              </span>
            )}
          </div>

          {/* Sort Dropdown - Better mobile layout */}
          <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700 shrink-0">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
              className="flex-1 sm:flex-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white sm:min-w-[180px]"
            >
              <option value="most-relevant">Most Relevant</option>
              <option value="newest">New In</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Ratings</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8">
              {paginatedProducts.map((product) => (
                <ProductGridCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 sm:mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {searchQuery
                ? `No products match your search for "${searchQuery}"`
                : 'No products available at the moment'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}