'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/amplify-client';
import { useCart } from '@/components/providers/cart-provider';
import type { CartItem as CartItemType, Product } from '@/types';

interface CartItemProps {
  item: CartItemType & { product?: Product };
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(true);
    try {
      await updateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removeItem(item.id);
    } catch (error) {
      console.error('Error removing item:', error);
      setIsRemoving(false);
    }
  };

  const product = item.product;
  const productImage = product?.images?.[0] || '/placeholder-product.jpg';
  const productName = product?.name || 'Product';

  return (
    <div className={`flex items-center space-x-4 py-6 border-b border-gray-200 ${isRemoving ? 'opacity-50' : ''}`}>
      {/* Product Image */}
      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={productImage}
          alt={productName}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link 
          href={`/products/${item.productId}`}
          className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          {productName}
        </Link>
        
        {product?.category && (
          <p className="text-sm text-gray-500 capitalize mt-1">
            {product.category}
          </p>
        )}

        {product?.weight && (
          <p className="text-sm text-gray-500 mt-1">
            Weight: {product.weight}g
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-2">
            <label htmlFor={`quantity-${item.id}`} className="text-sm text-gray-600">
              Qty:
            </label>
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                −
              </button>
              <input
                id={`quantity-${item.id}`}
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const newQuantity = parseInt(e.target.value);
                  if (newQuantity > 0) {
                    handleQuantityChange(newQuantity);
                  }
                }}
                disabled={isUpdating}
                className="w-16 px-2 py-1 text-center border-0 focus:ring-0 disabled:opacity-50"
              />
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="text-right">
        <div className="text-lg font-semibold text-gray-900">
          {formatCurrency(item.totalPrice)}
        </div>
        <div className="text-sm text-gray-500">
          {formatCurrency(item.unitPrice)} each
        </div>
      </div>
    </div>
  );
}