// Product inventory management component
'use client';

import React, { useState, useEffect } from 'react';
import { AdminProductService } from '@/lib/services/admin-products';
import { LoadingSpinner } from '@/components/ui';

interface InventoryManagerProps {
  productId: string;
  onClose: () => void;
}

interface InventoryData {
  stockQuantity: number;
  reorderPoint: number;
  supplierName: string;
  supplierContact: string;
  leadTime: number;
}

export default function ProductInventoryManager({ productId, onClose }: InventoryManagerProps) {
  const [inventory, setInventory] = useState<InventoryData>({
    stockQuantity: 0,
    reorderPoint: 5,
    supplierName: '',
    supplierContact: '',
    leadTime: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, [productId]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const result = await AdminProductService.getProduct(productId);
      
      if (result.product?.inventory) {
        const inv = result.product.inventory;
        setInventory({
          stockQuantity: inv.stockQuantity || 0,
          reorderPoint: inv.reorderPoint || 5,
          supplierName: inv.supplierName || '',
          supplierContact: inv.supplierContact || '',
          leadTime: inv.leadTime || 7,
        });
      }
    } catch (err) {
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await AdminProductService.updateInventory(productId, inventory);
      onClose();
    } catch (err) {
      setError('Failed to update inventory');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Manage Inventory</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
            <input
              type="number"
              min="0"
              value={inventory.stockQuantity}
              onChange={(e) => setInventory(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Point</label>
            <input
              type="number"
              min="0"
              value={inventory.reorderPoint}
              onChange={(e) => setInventory(prev => ({ ...prev, reorderPoint: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
            <input
              type="text"
              value={inventory.supplierName}
              onChange={(e) => setInventory(prev => ({ ...prev, supplierName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Contact</label>
            <input
              type="text"
              value={inventory.supplierContact}
              onChange={(e) => setInventory(prev => ({ ...prev, supplierContact: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Time (days)</label>
            <input
              type="number"
              min="0"
              value={inventory.leadTime}
              onChange={(e) => setInventory(prev => ({ ...prev, leadTime: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving && <LoadingSpinner size="sm" />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}