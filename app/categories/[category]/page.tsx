import { ProductCatalog } from '@/components/product';

interface CategoryPageProps {
  params: {
    category: 'traditional' | 'modern' | 'designer';
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const categoryTitles = {
    traditional: 'Traditional Jewelry',
    modern: 'Modern Jewelry',
    designer: 'Designer Jewelry'
  };

  const categoryDescriptions = {
    traditional: 'Timeless designs that honor age-old traditions and cultural heritage',
    modern: 'Contemporary styles that blend tradition with modern aesthetics',
    designer: 'Exclusive designer pieces crafted for the discerning customer'
  };

  return (
    <div className="pt-52 sm:pt-44 lg:pt-48 pb-8">
      <div className="container mx-auto px-4 mb-8 sm:mb-10 lg:mb-12">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-4 tracking-wide capitalize">
            {categoryTitles[params.category]}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            {categoryDescriptions[params.category]}
          </p>
        </div>
      </div>
      
      <ProductCatalog 
        initialCategory={params.category}
        showFilters={true}
        showSearch={true}
        limit={24}
      />
    </div>
  );
}