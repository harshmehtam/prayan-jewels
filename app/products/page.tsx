import { ProductCatalog } from '@/components/product';
interface ProductsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <div className="pt-50 sm:pt-44 lg:pt-28 pb-4 sm:pb-8">
      <ProductCatalog
        searchParams={searchParams}
      />
    </div>
  );
}