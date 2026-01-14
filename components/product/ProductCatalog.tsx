import type { ProductFilters } from '@/types';
import { getProducts } from '@/lib/services/product-service';
import ProductGridCard from './ProductGridCard';
import SortDropdown from './SortDropdown';
import PaginationControls from './PaginationControls';
import ClearFiltersButton from './ClearFiltersButton';

interface ProductCatalogProps {
  searchParams?: {
    maxPrice?: string;
    minPrice?: string;
    search?: string;
    sortBy?: string;
    nextToken?: string;
  };
  showBestsellers?: boolean;
  itemsPerPage?: number;
}

export default async function ProductCatalog({
  searchParams = {},
  showBestsellers = false,
  itemsPerPage = 12,
}: ProductCatalogProps) {
  const { maxPrice, minPrice, search, sortBy = 'most-relevant', nextToken } = searchParams;

  // Build filters object
  const filters: ProductFilters = {};

  if (maxPrice) {
    filters.maxPrice = parseInt(maxPrice);
  }

  if (minPrice) {
    filters.minPrice = parseInt(minPrice);
  }

  if (search) {
    filters.searchQuery = search.trim();
  }

  if (sortBy) {
    filters.sortBy = sortBy as ProductFilters['sortBy'];
  }

  // Fetch products on server
  const { products, hasNextPage, nextToken: newNextToken } = await getProducts(
    filters, 
    itemsPerPage, 
    nextToken
  );

  const isFirstPage = !nextToken;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-12 sm:pb-8 lg:pb-10">
      {/* Header Section */}
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
          {!showBestsellers && (maxPrice || minPrice) && (
            <div className="flex-shrink-0">
              <ClearFiltersButton searchQuery={search} />
            </div>
          )}
        </div>
      </div>

      <div className="w-full">
        {/* Sort and Results Count */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
          <div className="text-sm text-gray-600 order-2 sm:order-1">
            {search ? (
              <span>Showing results for "{search}"</span>
            ) : (
              <span>Showing {products.length} items</span>
            )}
          </div>

          <SortDropdown currentSort={sortBy} />
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8">
              {products.map((product) => (
                <ProductGridCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {(hasNextPage || !isFirstPage) && (
              <PaginationControls
                hasNextPage={hasNextPage}
                nextToken={newNextToken}
                isFirstPage={isFirstPage}
              />
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
              {search
                ? `No products match your search for "${search}"`
                : 'No products available at the moment'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}