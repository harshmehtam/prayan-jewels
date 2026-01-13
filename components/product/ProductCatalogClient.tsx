'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { Product } from '@/types';
import ProductGridCard from './ProductGridCard';

interface ProductCatalogClientProps {
  products: Product[];
  hasNextPage: boolean;
  nextToken?: string;
  initialSearchQuery?: string;
  initialSortBy?: string;
  showFilters?: boolean;
}

export default function ProductCatalogClient({
  products,
  hasNextPage,
  nextToken,
  initialSearchQuery = '',
  initialSortBy = 'most-relevant',
  showFilters = true,
}: ProductCatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const maxPrice = searchParams.get('maxPrice');
  const minPrice = searchParams.get('minPrice');
  const sortBy = searchParams.get('sortBy') || initialSortBy;
  const currentToken = searchParams.get('nextToken');

  // Update URL with new parameters
  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (newSort: string) => {
    // Reset pagination when sorting changes
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', newSort);
    params.delete('nextToken'); // Reset to first page
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleNextPage = () => {
    if (nextToken) {
      updateURL({ nextToken });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    // Remove nextToken to go back to first page
    // Note: For true previous page, you'd need to maintain a token history
    const params = new URLSearchParams(searchParams.toString());
    params.delete('nextToken');
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams();
    // Keep search query if it exists
    if (initialSearchQuery) {
      params.set('search', initialSearchQuery);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const isFirstPage = !currentToken;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-12 sm:pb-8 lg:pb-10">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-2 tracking-wide">
              {maxPrice ? `Products Under ₹${parseInt(maxPrice).toLocaleString()}` : 'Our Collection'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
              {maxPrice 
                ? `Discover beautiful jewelry pieces within your budget of ₹${parseInt(maxPrice).toLocaleString()}`
                : 'Our most popular and trending jewelry pieces'
              }
            </p>
          </div>
          
          {/* Clear Filters Button */}
          {showFilters && (maxPrice || minPrice) && (
            <div className="flex-shrink-0">
              <button
                onClick={handleClearFilters}
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

      <div className="w-full">
        {/* Sort and Results Count */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
          <div className="text-sm text-gray-600 order-2 sm:order-1">
            {initialSearchQuery ? (
              <span>
                Showing results for "{initialSearchQuery}"
              </span>
            ) : (
              <span>
                Showing {products.length} items
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700 shrink-0">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white sm:min-w-[180px]"
            >
              <option value="most-relevant">Most Relevant</option>
              <option value="newest">New In</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Ratings</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8">
              {products.map((product) => (
                <ProductGridCard key={product.id} product={product} />
              ))}
            </div>

            {/* NextToken-based Pagination */}
            {(hasNextPage || !isFirstPage) && (
              <div className="flex justify-center items-center gap-4 mt-8 sm:mt-12">
                <button
                  onClick={handlePreviousPage}
                  disabled={isFirstPage}
                  className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                    isFirstPage
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <button
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                  className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                    !hasNextPage
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                  }`}
                >
                  Next
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
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
              {initialSearchQuery
                ? `No products match your search for "${initialSearchQuery}"`
                : 'No products available at the moment'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
