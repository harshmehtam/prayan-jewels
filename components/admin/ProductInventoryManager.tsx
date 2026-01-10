// COMMENTED OUT - Product inventory manager component - Not needed for now since inventory models are disabled
/*
'use client';

import React, { useState, useEffect } from 'react';
import { Product, InventoryItem } from '@/types';
import { InventoryService } from '@/lib/data/inventory';
import { AdminProductService } from '@/lib/services/admin-products';
import { LoadingSpinner } from '@/components/ui';

// Component implementation commented out since inventory is disabled
*/

// Stub component for build compatibility
export default function ProductInventoryManager({ 
  productId, 
  onClose 
}: { 
  productId: string; 
  onClose: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Product Inventory</h2>
          <p className="text-gray-500 mb-6">Inventory management is currently disabled</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}