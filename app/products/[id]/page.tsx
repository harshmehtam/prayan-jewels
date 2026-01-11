import { ProductDetail } from '@/components/product';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  
  return (
    <div className="pt-42 sm:pt-40 lg:pt-28 pb-4 sm:pb-6">
      <ProductDetail productId={id} />
    </div>
  );
}