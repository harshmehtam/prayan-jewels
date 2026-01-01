import { ProductDetail } from '@/components/product';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  
  return (
    <div className="py-8">
      <ProductDetail productId={id} />
    </div>
  );
}