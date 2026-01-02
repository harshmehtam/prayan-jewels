'use client';

import { ProductCatalog } from '@/components/product';

export default function ProductsPage() {
  return (
    <div className="py-4 sm:py-8">
      <div className="container mx-auto container-mobile mb-6 sm:mb-8">
        <h1 className="text-responsive-2xl font-bold text-gray-900 mb-4">
          All Products
        </h1>
        <p className="text-gray-600 text-responsive-sm">
          Browse our complete collection of silver mangalsutra designs
        </p>
      </div>
      
      <ProductCatalog 
        showFilters={true}
        showSearch={true}
        limit={24}
      />
    </div>
  );
}