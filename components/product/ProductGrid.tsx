import Link from 'next/link';
import { getProducts } from '@/lib/services/product-service';
import { batchCheckWishlist } from '@/app/actions/wishlist-actions';
import ProductGridCard from './ProductGridCard';

interface ProductGridProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showViewAll?: boolean;
}

export default async function ProductGrid({ 
  title = "Discover Our Collection",
  subtitle,
  limit = 4,
  showViewAll = true
}: ProductGridProps) {
  const result = await getProducts({}, limit);
  const products = result.products;

  // Batch check wishlist status for all products
  const productIds = products.map(p => p.id);
  const wishlistStatus = await batchCheckWishlist(productIds);

  if (products.length === 0) {
    return (
      <section className="pt-6 sm:pt-8 lg:pt-10 pb-12 sm:pb-16 lg:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-light text-gray-900 mb-4 tracking-wide">
              {title}
            </h2>
            <p className="text-gray-600">
              No products available at the moment
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 max-w-7xl mx-auto">
          {products.map((product) => (
            <ProductGridCard 
              key={product.id} 
              product={product}
              isInWishlist={wishlistStatus[product.id] || false}
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