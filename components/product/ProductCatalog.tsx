import { getProducts } from '@/lib/services/product-service';
import { ProductFilters } from '@/types';
import ProductCatalogClient from './ProductCatalogClient';

interface ProductCatalogProps {
  showBestsellers?: boolean;
  itemsPerPage?: number;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ProductCatalog({
  showBestsellers = false,
  itemsPerPage = 12,
  searchParams = {}
}: ProductCatalogProps) {
  const filters: ProductFilters = {};

  const maxPrice = searchParams?.maxPrice;
  if (maxPrice && typeof maxPrice === 'string') {
    filters.maxPrice = parseInt(maxPrice);
  }

  const minPrice = searchParams?.minPrice;
  if (minPrice && typeof minPrice === 'string') {
    filters.minPrice = parseInt(minPrice);
  }

  const searchQuery = searchParams?.search;
  if (searchQuery && typeof searchQuery === 'string') {
    filters.searchQuery = searchQuery.trim();
  }

  const sortBy = searchParams?.sortBy;
  if (sortBy && typeof sortBy === 'string') {
    filters.sortBy = sortBy as ProductFilters['sortBy'];
  }

  // Get nextToken from URL for pagination
  const nextToken = searchParams?.nextToken;
  const token = nextToken && typeof nextToken === 'string' ? nextToken : undefined;

  // Fetch products server-side with nextToken pagination
  const result = await getProducts(filters, itemsPerPage, token);

  return (
    <ProductCatalogClient
      products={result.products}
      hasNextPage={result.hasNextPage}
      nextToken={result.nextToken}
      initialSearchQuery={filters.searchQuery}
      initialSortBy={filters.sortBy}
      showFilters={!showBestsellers}
    />
  );
}