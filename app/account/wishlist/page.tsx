'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { LoginButton } from '@/components/auth';
import { LoadingSpinner } from '@/components/ui';
import CachedAmplifyImage from '@/components/ui/CachedAmplifyImage';
import { getWishlist, removeFromWishlist } from '@/app/actions/wishlist-actions';
import { addToCart } from '@/app/actions/cart-actions';
import type { WishlistItem } from '@/lib/services/wishlist-service';

export default function WishlistPage() {
  const { isAuthenticated } = useUser();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingToCart, setMovingToCart] = useState<string | null>(null);
  const [removingItem, setRemovingItem] = useState<string | null>(null);

  // Load wishlist
  const loadWishlist = async () => {
    setLoading(true);
    const items = await getWishlist();
    setWishlistItems(items);
    setLoading(false);
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  // Handle move to cart
  const handleMoveToCart = async (productId: string, price: number) => {
    setMovingToCart(productId);
    try {
      const addResult = await addToCart(productId, 1, price);

      if (addResult.success) {
        const removeResult = await removeFromWishlist(productId);

        if (removeResult.success) {
          // Reload wishlist
          await loadWishlist();
        }
      }
    } catch (error) {
      console.error('Error moving item to cart:', error);
    } finally {
      setMovingToCart(null);
    }
  };

  // Handle remove from wishlist
  const handleRemove = async (productId: string) => {
    setRemovingItem(productId);
    try {
      const result = await removeFromWishlist(productId);

      if (result.success) {
        await loadWishlist();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setRemovingItem(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">My Wishlist</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <svg className="w-12 h-12 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Please Log In</h3>
            <p className="text-gray-600 mb-4">You need to be logged in to view your wishlist.</p>
            <LoginButton redirectTo="/account/wishlist">
              Log In
            </LoginButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h1>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>

        {/* Wishlist Content */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Save your favorite designs to view them here</p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Browse Products
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="relative aspect-square">
                  <Link href={`/products/${item.productId}`}>
                    <CachedAmplifyImage
                      path={item.productImage || 'placeholder-product.jpg'}
                      alt={item.productName || 'Product'}
                      className="object-cover rounded-t-lg w-full h-full"
                    />
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={removingItem === item.productId}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {removingItem === item.productId ? (
                      <svg className="w-4 h-4 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Product Details */}
                <div className="p-4">
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                      {item.productName || 'Product Name'}
                    </h3>
                  </Link>

                  <p className="text-lg font-semibold text-gray-900 mt-2">
                    ₹{item.productPrice?.toFixed(2) || '0.00'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={() => handleMoveToCart(item.productId, item.productPrice || 0)}
                      disabled={movingToCart === item.productId}
                      className="flex-1 bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 px-4 py-2 text-sm font-semibold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      {movingToCart === item.productId ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Moving...
                        </div>
                      ) : (
                        'Move to Cart'
                      )}
                    </button>

                    <Link
                      href={`/products/${item.productId}`}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium uppercase tracking-wider"
                    >
                      View
                    </Link>
                  </div>

                  {/* Added Date */}
                  <p className="text-xs text-gray-500 mt-3">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}