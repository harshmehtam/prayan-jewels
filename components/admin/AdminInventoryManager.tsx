// Admin inventory control interface with real-time monitoring and management
'use client';

import React, { useState, useEffect } from 'react';
import { Product, InventoryItem, InventoryAlert } from '@/types';
import { InventoryService } from '@/lib/data/inventory';
import { AdminProductService } from '@/lib/services/admin-products';
import { PermissionGate } from '@/components/auth/AdminRoute';
import { LoadingSpinner } from '@/components/ui';
import InventoryAlertManager from './InventoryAlertManager';

interface AdminInventoryManagerProps {
  className?: string;
}

interface InventoryWithProduct extends InventoryItem {
  product?: Product;
}

interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

interface StockAdjustment {
  productId: string;
  currentStock: number;
  newStock: number;
  reason: string;
}

export default function AdminInventoryManager({ className = '' }: AdminInventoryManagerProps) {
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all');
  const [showStockAdjustment, setShowStockAdjustment] = useState<StockAdjustment | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'adjust_stock' | 'update_reorder' | ''>('');

  // Load inventory data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all products with their inventory
      const productsResult = await AdminProductService.getProducts({}, 1000);
      const inventoryData: InventoryWithProduct[] = [];
      let totalValue = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      for (const product of productsResult.products) {
        try {
          const inventoryResult = await InventoryService.getProductInventory(product.id);
          if (inventoryResult.inventory) {
            // Clean up the product data to match our types
            const cleanProduct: Product = {
              ...product,
              images: product.images?.filter((img): img is string => img !== null) || [],
              occasion: product.occasion?.filter((occ): occ is string => occ !== null) || null,
              keywords: product.keywords?.filter((kw): kw is string => kw !== null) || null,
            };

            const inventoryItem: InventoryWithProduct = {
              ...inventoryResult.inventory,
              reservedQuantity: inventoryResult.inventory.reservedQuantity || 0,
              reorderPoint: inventoryResult.inventory.reorderPoint || 5,
              supplierName: inventoryResult.inventory.supplierName || undefined,
              supplierContact: inventoryResult.inventory.supplierContact || undefined,
              leadTime: inventoryResult.inventory.leadTime || undefined,
              lastRestocked: inventoryResult.inventory.lastRestocked || undefined,
              product: cleanProduct
            };
            inventoryData.push(inventoryItem);

            // Calculate stats
            totalValue += (inventoryItem.stockQuantity || 0) * cleanProduct.price;
            
            if ((inventoryItem.availableQuantity || 0) === 0) {
              outOfStockCount++;
            } else if ((inventoryItem.availableQuantity || 0) <= (inventoryItem.reorderPoint || 5)) {
              lowStockCount++;
            }
          }
        } catch (err) {
          console.warn(`Failed to load inventory for product ${product.id}:`, err);
        }
      }

      setInventory(inventoryData);
      setStats({
        totalProducts: inventoryData.length,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
        totalValue
      });

      // Generate alerts
      const inventoryAlerts: InventoryAlert[] = inventoryData
        .filter(item => {
          const available = item.availableQuantity || 0;
          return available === 0 || available <= (item.reorderPoint || 5);
        })
        .map(item => ({
          productId: item.productId,
          productName: item.product?.name || 'Unknown Product',
          currentStock: item.availableQuantity || 0,
          reorderPoint: item.reorderPoint || 5,
          alertType: (item.availableQuantity || 0) === 0 ? 'out_of_stock' : 'low_stock'
        }));

      setAlerts(inventoryAlerts);
    } catch (err) {
      console.error('Error loading inventory data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Filter inventory based on search and status
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchQuery || 
      item.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'out_of_stock' && (item.availableQuantity || 0) === 0) ||
      (statusFilter === 'low_stock' && (item.availableQuantity || 0) > 0 && (item.availableQuantity || 0) <= (item.reorderPoint || 5)) ||
      (statusFilter === 'in_stock' && (item.availableQuantity || 0) > (item.reorderPoint || 5));

    return matchesSearch && matchesStatus;
  });

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    if (!showStockAdjustment || !adjustmentReason.trim()) {
      setError('Please provide a reason for the stock adjustment');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await InventoryService.updateStock(
        showStockAdjustment.productId,
        showStockAdjustment.newStock
      );

      // Reload inventory data
      await loadInventoryData();
      
      setShowStockAdjustment(null);
      setAdjustmentReason('');
    } catch (err) {
      console.error('Error adjusting stock:', err);
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle bulk stock adjustment
  const handleBulkStockAdjustment = async (adjustment: number) => {
    if (selectedItems.size === 0) {
      setError('Please select items to adjust');
      return;
    }

    if (!confirm(`Are you sure you want to adjust stock for ${selectedItems.size} items?`)) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      for (const productId of selectedItems) {
        const item = inventory.find(inv => inv.productId === productId);
        if (item) {
          const newStock = Math.max(0, (item.stockQuantity || 0) + adjustment);
          await InventoryService.updateStock(productId, newStock);
        }
      }

      await loadInventoryData();
      setSelectedItems(new Set());
      setBulkAction('');
    } catch (err) {
      console.error('Error performing bulk adjustment:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform bulk adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle item selection
  const handleItemSelect = (productId: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedItems(newSelected);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(filteredInventory.map(item => item.productId)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'blue',
    subtitle
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    color?: 'blue' | 'green' | 'yellow' | 'red';
    subtitle?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200',
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg border ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Control</h1>
          <p className="text-gray-600 mt-1">Monitor and manage product inventory levels</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAlertSettings(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-6h5v6z" />
            </svg>
            <span>Alert Settings</span>
          </button>
          <button
            onClick={loadInventoryData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-gray-200 w-12 h-12"></div>
                  <div className="ml-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              color="blue"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />
            <StatCard
              title="Low Stock Items"
              value={stats.lowStockItems}
              color="yellow"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              }
            />
            <StatCard
              title="Out of Stock"
              value={stats.outOfStockItems}
              color="red"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            />
            <StatCard
              title="Total Inventory Value"
              value={`₹${stats.totalValue.toLocaleString()}`}
              color="green"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
          </>
        ) : null}
      </div>

      {/* Inventory Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="ml-2 text-sm font-medium text-yellow-800">Inventory Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-yellow-700">
                  <strong>{alert.productName}</strong> - {alert.alertType === 'out_of_stock' ? 'Out of stock' : `Low stock (${alert.currentStock} remaining)`}
                </span>
                <button
                  onClick={() => setShowStockAdjustment({
                    productId: alert.productId,
                    currentStock: alert.currentStock,
                    newStock: alert.reorderPoint + 10,
                    reason: ''
                  })}
                  className="text-yellow-600 hover:text-yellow-800 font-medium"
                >
                  Adjust Stock
                </button>
              </div>
            ))}
            {alerts.length > 5 && (
              <p className="text-sm text-yellow-600">
                And {alerts.length - 5} more alerts...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Items</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadInventoryData}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.size} items selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkStockAdjustment(10)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  +10 Stock
                </button>
                <button
                  onClick={() => handleBulkStockAdjustment(-10)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  -10 Stock
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredInventory.length && filteredInventory.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Levels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Restocked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const available = item.availableQuantity || 0;
                  const reorderPoint = item.reorderPoint || 5;
                  const isOutOfStock = available === 0;
                  const isLowStock = available > 0 && available <= reorderPoint;
                  
                  return (
                    <tr key={item.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.productId)}
                          onChange={(e) => handleItemSelect(item.productId, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                              alt={item.product?.name || 'Product'}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {item.product?.name || 'Unknown Product'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ₹{item.product?.price?.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Stock: <span className="font-medium">{item.stockQuantity || 0}</span></div>
                          <div>Reserved: <span className="font-medium">{item.reservedQuantity || 0}</span></div>
                          <div>Available: <span className="font-medium">{available}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isOutOfStock ? 'bg-red-100 text-red-800' :
                          isLowStock ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reorderPoint}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <PermissionGate resource="admin/inventory" action="update">
                            <button
                              onClick={() => setShowStockAdjustment({
                                productId: item.productId,
                                currentStock: item.stockQuantity || 0,
                                newStock: item.stockQuantity || 0,
                                reason: ''
                              })}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Adjust
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showStockAdjustment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Adjust Stock</h3>
              <button
                onClick={() => setShowStockAdjustment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                <input
                  type="number"
                  value={showStockAdjustment.currentStock}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Stock Level</label>
                <input
                  type="number"
                  min="0"
                  value={showStockAdjustment.newStock}
                  onChange={(e) => setShowStockAdjustment(prev => prev ? {
                    ...prev,
                    newStock: parseInt(e.target.value) || 0
                  } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Adjustment *</label>
                <textarea
                  required
                  rows={3}
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Received new stock, Damaged items removed, Inventory correction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Change:</strong> {showStockAdjustment.newStock - showStockAdjustment.currentStock > 0 ? '+' : ''}{showStockAdjustment.newStock - showStockAdjustment.currentStock}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowStockAdjustment(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStockAdjustment}
                disabled={submitting || !adjustmentReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting && <LoadingSpinner size="sm" />}
                <span>Update Stock</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Inventory Alert Manager Modal */}
      {showAlertSettings && (
        <InventoryAlertManager
          onClose={() => setShowAlertSettings(false)}
        />
      )}
    </div>
  );
}