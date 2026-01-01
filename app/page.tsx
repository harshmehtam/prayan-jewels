import { ProductCatalog } from '@/components/product';

export default function Home() {
  return (
    <div className="py-4 sm:py-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 sm:py-12 lg:py-16 mb-6 sm:mb-8">
        <div className="container mx-auto container-mobile text-center">
          <h1 className="text-responsive-2xl font-bold mb-4">
            Exquisite Silver Mangalsutra Collection
          </h1>
          <p className="text-responsive-base mb-6 sm:mb-8 max-w-3xl mx-auto">
            Discover our handcrafted silver mangalsutra designs that blend tradition with modern elegance
          </p>
          <button className="bg-white text-blue-600 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors focus-ring text-responsive-sm">
            Shop Now
          </button>
        </div>
      </section>

      {/* Product Catalog */}
      <ProductCatalog 
        showFilters={true}
        showSearch={true}
        limit={20}
      />
    </div>
  );
}
