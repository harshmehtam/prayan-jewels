'use client';

import { ProductCatalog } from '@/components/product';

export default function ProductsPage() {
  return (
    <div className="pt-50 sm:pt-44 lg:pt-28 pb-4 sm:pb-8">
      <ProductCatalog 
        limit={24}
      />
    </div>
  );
}