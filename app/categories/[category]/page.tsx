import { ProductCatalog } from '@/components/product';

interface CategoryPageProps {
  params: {
    category: 'traditional' | 'modern' | 'designer';
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const categoryTitles = {
    traditional: 'Traditional Mangalsutra',
    modern: 'Modern Mangalsutra',
    designer: 'Designer Mangalsutra'
  };

  const categoryDescriptions = {
    traditional: 'Timeless designs that honor age-old traditions and cultural heritage',
    modern: 'Contemporary styles that blend tradition with modern aesthetics',
    designer: 'Exclusive designer pieces crafted for the discerning bride'
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 capitalize">
          {categoryTitles[params.category]}
        </h1>
        <p className="text-gray-600">
          {categoryDescriptions[params.category]}
        </p>
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