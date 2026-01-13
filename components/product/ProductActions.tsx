import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AddToCartButton } from '@/components/cart';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { useCart } from '@/components/providers/cart-provider';
import type { Product } from '@/types';

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const { toggleWishlist, wishlistStatus } = useWishlist();
  const { addItem } = useCart();
  const router = useRouter();

  // Update wishlist status from context
  useEffect(() => {
    setIsInWishlist(wishlistStatus[product.id] || false);
  }, [wishlistStatus, product.id]);

  const handleBuyNow = async () => {
    setIsBuyingNow(true);
    
    try {
      await addItem(product.id, 1, product.price);
      router.push('/checkout');
    } catch (error) {
      console.error('Failed to add product to cart:', error);
      setIsBuyingNow(false);
      alert('Failed to add product to cart. Please try again.');
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsTogglingWishlist(true);
    
    try {
      const productDetails = {
        name: product.name,
        price: product.price,
        image: product.images[0] || ''
      };
      
      const result = await toggleWishlist(product.id, productDetails);
      setIsInWishlist(result.isInWishlist);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <div className="flex items-center gap-3 md:gap-4">
        <AddToCartButton 
          product={product}
          quantity={1}
          className="flex-1 bg-black text-white px-6 py-3 md:py-4 text-sm md:text-base font-medium uppercase tracking-wider hover:bg-gray-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-none"
          buttonText="ADD TO BAG"
        />
        <button
          onClick={handleWishlistToggle}
          disabled={isTogglingWishlist}
          className="w-12 h-12 md:w-12 md:h-12 border-2 border-gray-300 hover:border-gray-900 transition-all duration-300 flex items-center justify-center group flex-shrink-0 disabled:opacity-50"
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          style={{ height: '48px' }}
        >
          {isTogglingWishlist ? (
            <svg className="w-5 h-5 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg 
              className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-300 group-hover:scale-110 ${
                isInWishlist 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-gray-600 group-hover:text-red-500'
              }`}
              fill={isInWishlist ? "currentColor" : "none"}
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          )}
        </button>
      </div>
      
      <button
        onClick={handleBuyNow}
        disabled={isBuyingNow}
        className="w-full bg-white text-gray-900 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold uppercase tracking-wider border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isBuyingNow ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          'Buy Now'
        )}
      </button>
    </div>
  );
}
