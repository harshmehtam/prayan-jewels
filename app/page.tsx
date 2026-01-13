import Link from 'next/link';
import PriceRangeCards from '@/components/product/PriceRangeCards';
import ProductGrid from '@/components/product/ProductGrid';
import FeaturesSection from '@/components/layout/FeaturesSection';

export default async function Home() {
  return (
    <div>
      {/* Hero Section - Mobile optimized */}
      <section
        className={`relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] overflow-hidden pt-20 sm:pt-24 pt-32`}
      >
        {/* Large Background Image Area */}
        <div className="absolute inset-0 top-0">
          {/* Full background with jewelry photography style */}
          <div className="w-full h-full bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100 relative">
            {/* Rich, warm background gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200/40 via-orange-200/30 to-pink-200/40"></div>

            {/* Split composition - left side for hands/jewelry, right side for model */}
            <div className="absolute left-0 top-0 w-1/2 h-full">
              <div className="w-full h-full bg-gradient-to-br from-amber-300/30 to-orange-300/30 relative">
                <div className="absolute top-1/3 left-1/3 w-32 h-32 sm:w-64 sm:h-64 bg-yellow-400/15 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-24 h-24 sm:w-48 sm:h-48 bg-orange-400/20 rounded-full blur-2xl"></div>
              </div>
            </div>

            <div className="absolute right-0 top-0 w-1/2 h-full">
              <div className="w-full h-full bg-gradient-to-bl from-orange-300/30 to-pink-300/30 relative">
                <div className="absolute top-1/4 right-1/3 w-28 h-28 sm:w-56 sm:h-56 bg-pink-400/15 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/4 w-20 h-20 sm:w-40 sm:h-40 bg-rose-400/20 rounded-full blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content positioned - Better mobile vertical centering */}
        <div className="relative z-10 h-full flex items-center justify-center pt-20 pb-8 sm:pt-20 sm:pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile-first content positioning */}
            <div className="max-w-full sm:max-w-2xl mx-auto sm:mx-0 text-center sm:text-left sm:ml-8 lg:ml-20">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-light text-gray-900 mb-4 sm:mb-6 lg:mb-8 leading-tight tracking-wide">
                PLAYING FAVORITES
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 lg:mb-12 font-light px-4 sm:px-0">
                Discover our most loved styles
              </p>
              <Link
                href="/products"
                className="inline-block bg-white text-gray-900 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold uppercase tracking-wider border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-lg"
              >
                SHOP NOW
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Price Range Cards Section */}
      <PriceRangeCards />

      {/* Featured Products Grid */}
      <ProductGrid
        title="Jewelry Collection"
        subtitle="Discover timeless pieces crafted with precision and care"
        limit={4}
        showViewAll={true}
      />

      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
}
