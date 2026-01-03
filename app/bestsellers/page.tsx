'use client';

import { ProductCatalog } from '@/components/product';

export default function BestsellersPage() {
  return (
    <div className="py-4 sm:py-8">
      <ProductCatalog 
        showFilters={false}
        showSearch={false}
        showBestsellers={true}
        limit={50}
        itemsPerPage={8}
      />
    </div>
  );
}