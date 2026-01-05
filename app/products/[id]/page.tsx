import { ProductDetail } from '@/components/product';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  
  return (
    <div className="pt-46 sm:pt-44 lg:pt-28 pb-4 sm:pb-8">
      <ProductDetail productId={id} />
    </div>
  );
}