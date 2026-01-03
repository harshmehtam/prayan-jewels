'use client';

// TEMPORARY: Using mock data for design testing - REMOVE IN PRODUCTION

import { useState, useEffect } from 'react';
import Link from 'next/link';
// import { ProductService } from '@/lib/data/products';
import { MockProductService } from '@/lib/data/mock-products'; // TEMPORARY - REMOVE IN PRODUCTION
import ProductGridCard from './ProductGridCard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string | null;
  isActive: boolean | null;
  availableQuantity?: number;
  averageRating?: number | null;
  totalReviews?: number | null;
}

interface ProductGridProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showViewAll?: boolean;
  category?: 'traditional' | 'modern' | 'designer';
}

export default function ProductGrid({ 
  title = "Discover Our Collection",
  subtitle,
  limit = 15,
  showViewAll = true,
  category
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const filters = category ? { category } : {};
        // const result = await ProductService.getProducts(filters, limit);
        const result = await MockProductService.getProducts(filters, limit); // TEMPORARY - REMOVE IN PRODUCTION
        // console.log(`Requested ${limit} products, got ${result.products.length} products`); // DEBUG
        setProducts(result.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, limit]);

  if (loading) {
    return (
      <section className="pt-6 sm:pt-8 lg:pt-10 pb-12 sm:pb-16 lg:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2 tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-600 text-sm sm:text-base">{subtitle}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || products.length === 0) {
    return (
      <section className="pt-6 sm:pt-8 lg:pt-10 pb-12 sm:pb-16 lg:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4 tracking-wide">
              {title}
            </h2>
            <p className="text-gray-600">
              {error || 'No products available at the moment'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-6 sm:pt-8 lg:pt-10 pb-12 sm:pb-16 lg:pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2 tracking-wide">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-sm sm:text-base">{subtitle}</p>
          )}
        </div>

        {/* Products Grid - Better responsive layout like PriceRangeCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 max-w-7xl mx-auto">
          {products.map((product, index) => (
            <ProductGridCard 
              key={product.id} 
              product={product} 
              index={index}
            />
          ))}
        </div>

        {/* View All Button */}
        {showViewAll && (
          <div className="text-center">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 border border-gray-900 text-sm font-medium text-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 uppercase tracking-wider"
            >
              View All Products
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}