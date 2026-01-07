// Inventory reporting and analytics component
'use client';

import React, { useState, useEffect } from 'react';
import { Product, InventoryItem } from '@/types';
import { InventoryService } from '@/lib/data/inventory';
import { AdminProductService } from '@/lib/services/admin-products';
import { LoadingSpinner } from '@/components/ui';

interface InventoryReportsProps {
  className?: string;
}

interface InventoryReport {
  productId: string;
  productName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  unitPrice: number;
  totalValue: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastRestocked?: string;
  supplierName?: string;
  leadTime?: number;
}

interface StockMovement {
  date: string;
  productName: string;
  type: 'restock' | 'sale' | 'adjustment';
  quantity: number;
  reason?: string;
}

interface InventoryAnalytics {
  totalProducts: number;
  totalStockValue: number;
  averageStockLevel: number;
  stockTurnoverRate: number;
  lowStockPercentage: number;
  outOfStockPercentage: number;
  topSellingProducts: Array<{
    productName: string;
    soldQuantity: number;
    revenue: number;
  }>;
  slowMovingProducts: Array<{
    productName: string;
    stockLevel: number;
    daysSinceLastSale: number;
  }>;
}

export default function InventoryReports({ className = '' }: InventoryReportsProps) {
  const [reports, setReports] = useState<InventoryReport[]>([]);
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'movements' | 'analytics'>('summary');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  // Load inventory reports
  const loadInventoryReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all products with their inventory
      const productsResult = await AdminProductService.getProducts({}, 1000);
      const inventoryReports: InventoryReport[] = [];
      let totalValue = 0;
      let totalStock = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      for (const product of productsResult.products) {
        try {
          const inventoryResult = await InventoryService.getProductInventory(product.id);
          if (inventoryResult.inventory) {
            const inventory = inventoryResult.inventory;
            const available = inventory.availableQuantity || 0;
            const reorderPoint = inventory.reorderPoint || 5;
            const productValue = (inventory.stockQuantity || 0) * product.price;
            
            let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
            if (available === 0) {
              stockStatus = 'out_of_stock';
              outOfStockCount++;
            } else if (available <= reorderPoint) {
              stockStatus = 'low_stock';
              lowStockCount++;
            }

            const report: InventoryReport = {
              productId: product.id,
              productName: product.name,
              currentStock: inventory.stockQuantity || 0,
              reservedStock: inventory.reservedQuantity || 0,
              availableStock: available,
              reorderPoint,
              unitPrice: product.price,
              totalValue: productValue,
              stockStatus,
              lastRestocked: inventory.lastRestocked || undefined,
              supplierName: inventory.supplierName || undefined,
              leadTime: inventory.leadTime || undefined
            };

            inventoryReports.push(report);
            totalValue += productValue;
            totalStock += inventory.stockQuantity || 0;
          }
        } catch (err) {
          console.warn(`Failed to load inventory for product ${product.id}:`, err);
        }
      }

      setReports(inventoryReports);

      // Generate analytics
      const analytics: InventoryAnalytics = {
        totalProducts: inventoryReports.length,
        totalStockValue: totalValue,
        averageStockLevel: inventoryReports.length > 0 ? totalStock / inventoryReports.length : 0,
        stockTurnoverRate: 0, // Would need sales data to calculate
        lowStockPercentage: inventoryReports.length > 0 ? (lowStockCount / inventoryReports.length) * 100 : 0,
        outOfStockPercentage: inventoryReports.length > 0 ? (outOfStockCount / inventoryReports.length) * 100 : 0,
        topSellingProducts: [], // Would need sales data
        slowMovingProducts: inventoryReports
          .filter(report => report.currentStock > report.reorderPoint * 2)
          .map(report => ({
            productName: report.productName,
            stockLevel: report.currentStock,
            daysSinceLastSale: 0 // Would need sales data
          }))
          .slice(0, 10)
      };

      setAnalytics(analytics);

      // Generate mock stock movements for demonstration
      const movements: StockMovement[] = [
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          productName: 'Traditional Silver Mangalsutra',
          type: 'restock',
          quantity: 50,
          reason: 'New shipment received'
        },
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          productName: 'Modern Designer Mangalsutra',
          type: 'sale',
          quantity: -3,
          reason: 'Customer purchase'
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          productName: 'Classic Silver Chain',
          type: 'adjustment',
          quantity: -2,
          reason: 'Damaged items removed'
        }
      ];

      setStockMovements(movements);
    } catch (err) {
      console.error('Error loading inventory reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryReports();
  }, []);

  // Export reports
  const exportReports = () => {
    if (exportFormat === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Product Name',
      'Current Stock',
      'Reserved Stock',
      'Available Stock',
      'Reorder Point',
      'Unit Price',
      'Total Value',
      'Status',
      'Last Restocked',
      'Supplier',
      'Lead Time (days)'
    ];

    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        `"${report.productName}"`,
        report.currentStock,
        report.reservedStock,
        report.availableStock,
        report.reorderPoint,
        report.unitPrice,
        report.totalValue,
        report.stockStatus,
        report.lastRestocked ? new Date(report.lastRestocked).toLocaleDateString() : 'Never',
        `"${report.supplierName || ''}"`,
        report.leadTime || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // For a real implementation, you would use a library like jsPDF
    alert('PDF export would be implemented with a library like jsPDF');
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive inventory insights and reporting</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            onClick={exportReports}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export</span>
          </button>
          <button
            onClick={loadInventoryReports}
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

      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="movements">Stock Movements</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadInventoryReports}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && reportType === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Products"
            value={analytics.totalProducts}
            color="blue"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard
            title="Total Stock Value"
            value={`₹${analytics.totalStockValue.toLocaleString()}`}
            color="green"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
          <StatCard
            title="Low Stock %"
            value={`${analytics.lowStockPercentage.toFixed(1)}%`}
            color="yellow"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
          />
          <StatCard
            title="Out of Stock %"
            value={`${analytics.outOfStockPercentage.toFixed(1)}%`}
            color="red"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>
      )}

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {reportType === 'summary' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.productId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{report.productName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.availableStock} / {report.currentStock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            report.stockStatus === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                            report.stockStatus === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {report.stockStatus === 'out_of_stock' ? 'Out of Stock' :
                             report.stockStatus === 'low_stock' ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{report.totalValue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reportType === 'movements' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Stock Movements</h3>
                <div className="space-y-4">
                  {stockMovements.map((movement, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          movement.type === 'restock' ? 'bg-green-100 text-green-600' :
                          movement.type === 'sale' ? 'bg-blue-100 text-blue-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {movement.type === 'restock' ? '+' : movement.type === 'sale' ? '↓' : '±'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{movement.productName}</p>
                          <p className="text-xs text-gray-500">{movement.reason}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(movement.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}