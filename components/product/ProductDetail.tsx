import { getProductById } from '@/lib/services/product-service';
import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';
import WhyChooseUs from './WhyChooseUs';
import ProductDescription from './ProductDescription';
import ProductActions from './ProductActions';
import ProductReviews from './ProductReviews';
import AvailableCoupons from './AvailableCoupons';
import { DELIVERY_CONFIG } from '@/lib/config/delivery';

interface ProductDetailProps {
  productId: string;
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product Not Found</h3>
        <p className="text-gray-600 mb-4">{error}</p>
      </div>
    </div>
  );
}
  
function DeliveryInfo() {
  return (
    <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center mb-2 md:mb-3">
        <svg className="w-5 md:w-6 h-5 md:h-6 text-gray-700 mr-2 md:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span className="text-sm md:text-base font-medium text-gray-900">
          {DELIVERY_CONFIG.getDeliveryMessage()}
        </span>
      </div>
      <p className="text-xs md:text-sm text-gray-600">
        Free shipping on orders above ₹{DELIVERY_CONFIG.freeShippingThreshold}
      </p>
    </div>
  );
}

export default async function ProductDetail({ productId }: ProductDetailProps) {
  const product = await getProductById(productId);

  if (!product) {
    return <ErrorState error="Product not found" />;
  }

  return (
    <>
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Image Gallery - 2/3 width on desktop */}
          <ProductImageGallery 
            images={product.images} 
            productName={product.name} 
          />

          {/* Product Information - 1/3 width on desktop */}
          <div className="space-y-6 md:space-y-8 p-4 md:p-6 lg:col-span-1">
            <ProductInfo 
              name={product.name}
              price={product.price}
              actualPrice={product.actualPrice}
              averageRating={product.averageRating}
              totalReviews={product.totalReviews}
            />

            <WhyChooseUs />

            <ProductDescription description={product.description} />

            <DeliveryInfo />

            <AvailableCoupons 
              productId={productId} 
              productPrice={product.price} 
            />

            <ProductActions product={product} />
          </div>
        </div>
      </div>

      {/* Product Reviews Section */}
      <div className="container mx-auto px-4 py-8">
        <ProductReviews 
          productId={productId} 
        />
      </div>
    </>
  );
}