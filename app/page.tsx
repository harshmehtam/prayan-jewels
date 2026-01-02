import { ProductCatalog } from '@/components/product';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      {/* Hero Section - Push content down from fixed headers */}
      <section className="relative min-h-90vh overflow-hidden pt-30">
        {/* Large Background Image Area */}
        <div className="absolute inset-0 top-0">
          {/* Full background with jewelry photography style */}
          <div className="w-full h-full bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100 relative">
            {/* Rich, warm background gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200/40 via-orange-200/30 to-pink-200/40"></div>
            
            {/* Split composition - left side for hands/jewelry, right side for model */}
            <div className="absolute left-0 top-0 w-1/2 h-full">
              <div className="w-full h-full bg-gradient-to-br from-amber-300/30 to-orange-300/30 relative">
                <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-yellow-400/15 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl"></div>
              </div>
            </div>
            
            <div className="absolute right-0 top-0 w-1/2 h-full">
              <div className="w-full h-full bg-gradient-to-bl from-orange-300/30 to-pink-300/30 relative">
                <div className="absolute top-1/4 right-1/3 w-56 h-56 bg-pink-400/15 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-rose-400/20 rounded-full blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content positioned on LEFT side - pushed down from headers */}
        <div className="relative z-10 h-full flex items-center pt-8">
          <div className="container mx-auto container-mobile">
            {/* LEFT-aligned content with proper spacing */}
            <div className="max-w-lg ml-8 lg:ml-16">
              <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight tracking-wide">
                PLAYING FAVORITES
              </h1>
              <p className="text-lg lg:text-xl text-gray-700 mb-8 font-light">
                Discover our most loved styles
              </p>
              <Link 
                href="/products"
                className="inline-block bg-white text-gray-900 px-6 py-3 text-sm font-medium uppercase tracking-wider border border-gray-300 hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-md"
              >
                SHOP BESTSELLERS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog - Temporarily disabled for UI changes */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto container-mobile">
          <div className="text-center">
            <h2 className="text-3xl font-light text-gray-900 mb-8 tracking-wide">
              Featured Products
            </h2>
            <p className="text-gray-600">Product catalog temporarily disabled for UI updates</p>
          </div>
          {/* <ProductCatalog 
            showFilters={true}
            showSearch={true}
            limit={20}
          /> */}
        </div>
      </section>
    </div>
  );
}
