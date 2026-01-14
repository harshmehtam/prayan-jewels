import { ProductCatalog } from '@/components/product';

interface ProductsPageProps {
  searchParams: Promise<{
    maxPrice?: string;
    minPrice?: string;
    search?: string;
    sortBy?: string;
    nextToken?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  
  return (
    <div className="pt-50 sm:pt-44 lg:pt-28 pb-4 sm:pb-8">
      <ProductCatalog searchParams={params} />
    </div>
  );
}