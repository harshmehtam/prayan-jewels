'use client';

import { Suspense } from 'react';
import { ProductCatalog } from '@/components/product';

function ProductsContent() {
  return (
    <div className="pt-50 sm:pt-44 lg:pt-28 pb-4 sm:pb-8">
      <ProductCatalog 
        limit={24}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="pt-50 sm:pt-44 lg:pt-28 pb-4 sm:pb-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}