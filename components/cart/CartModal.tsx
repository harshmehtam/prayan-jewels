'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  inStock: boolean;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock cart data for UI development - matches the cart provider mock data
const mockCartItems: CartItem[] = [
  {
    id: 'item-1',
    name: 'Fine Chain Necklace 22"',
    image: '/images/products/necklace-1.jpg',
    price: 240,
    quantity: 2,
    size: '56cm/22"',
    inStock: true,
  },
  {
    id: 'item-2',
    name: 'December Birthstone Locket',
    image: '/images/products/locket-1.jpg',
    price: 149,
    quantity: 1,
    size: '12. December',
    inStock: true,
  },
  {
    id: 'item-3',
    name: 'Silver Chain Bracelet',
    image: '/images/products/bracelet-1.jpg',
    price: 149,
    quantity: 1,
    size: '18cm',
    inStock: true,
  },
  {
    id: 'item-3',
    name: 'Silver Chain Bracelet',
    image: '/images/products/bracelet-1.jpg',
    price: 149,
    quantity: 1,
    size: '18cm',
    inStock: true,
  },
];

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>(mockCartItems);
  const [isScrolled, setIsScrolled] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const estimatedTax = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
  const estimatedTotal = subtotal + estimatedTax;

  const handleContinueToCheckout = () => {
    // Close the modal first
    onClose();
    // Navigate to checkout page
    router.push('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <div className="relative mr-3">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">YOUR SHOPPING BAG</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Free delivery message - Remove this section */}
          
          {/* Scrollable Cart Items Section */}
          <div className="flex-1 overflow-y-auto">
            {/* Cart Items */}
            <div className="p-6 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        {item.size && (
                          <p className="text-sm text-gray-600">{item.size}</p>
                        )}
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-green-600 font-medium">In Stock</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Add engraving option for locket */}
                    {/* {item.name.includes('Locket') && (
                      <button className="text-sm text-gray-900 underline mb-2 flex items-center">
                        Add engraving
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )} */}

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-900">₹{item.price}</span>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed Bottom Section */}
          <div className="flex-shrink-0 border-t border-gray-200">
            {/* Order Summary */}
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Tax (GST 18%)</span>
                <span className="text-gray-900">₹{estimatedTax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Estimated Total and Checkout Button */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          {/* Estimated Total */}
          <div className="flex justify-between text-lg font-semibold mb-4">
            <span>Total</span>
            <span>₹{estimatedTotal.toFixed(2)}</span>
          </div>
          
          {/* Checkout Button */}
          <button 
            onClick={handleContinueToCheckout}
            className="w-full bg-black text-white py-4 text-sm font-medium uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            CONTINUE TO CHECKOUT
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}