// Admin product management interface with CRUD operations
'use client';

import React, { useState, useEffect } from 'react';
import { Product, CreateProductInput, UpdateProductInput } from '@/types';
import { AdminProductService } from '@/lib/services/admin-products';
import ProductInventoryManager from './ProductInventoryManager';
import { PermissionGate } from '@/components/auth/AdminRoute';
import { LoadingSpinner } from '@/components/ui';

interface AdminProductManagerProps {
  className?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  images: string[];
  category: 'traditional' | 'modern' | 'designer';
  material: string;
  weight: number;
  length: number;
  style: string;
  occasion: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  isActive: boolean;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  images: [],
  category: 'traditional',
  material: 'silver',
  weight: 0,
  length: 0,
  style: '',
  occasion: [],
  metaTitle: '',
  metaDescription: '',
  keywords: [],
  isActive: true,
};

export default function AdminProductManager({ className = '' }: AdminProductManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | ''>('');
  const [showInventoryManager, setShowInventoryManager] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'traditional' | 'modern' | 'designer'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        searchQuery: searchQuery || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        inStock: undefined,
      };
      
      const result = await AdminProductService.getProducts(filters, 100);
      let filteredProducts = result.products.map(product => ({
        ...product,
        images: product.images?.filter((img): img is string => img !== null) || [],
        occasion: product.occasion?.filter((occ): occ is string => occ !== null) || null,
        keywords: product.keywords?.filter((kw): kw is string => kw !== null) || null,
      }));
      
      // Apply status filter
      if (statusFilter === 'active') {
        filteredProducts = filteredProducts.filter(p => p.isActive);
      } else if (statusFilter === 'inactive') {
        filteredProducts = filteredProducts.filter(p => !p.isActive);
      }
      
      setProducts(filteredProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery, categoryFilter, statusFilter]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingProduct) {
        // Update existing product
        const updateData: UpdateProductInput = {
          id: editingProduct.id,
          ...formData,
        };
        
        const result = await AdminProductService.updateProduct(updateData);
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
      } else {
        // Create new product
        const createData: CreateProductInput = formData;
        const result = await AdminProductService.createProduct(createData);
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
      }

      // Reset form and reload products
      setFormData(initialFormData);
      setEditingProduct(null);
      setShowForm(false);
      await loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit product
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images,
      category: product.category || 'traditional',
      material: product.material || 'silver',
      weight: product.weight || 0,
      length: product.length || 0,
      style: product.style || '',
      occasion: product.occasion || [],
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      keywords: product.keywords || [],
      isActive: product.isActive ?? true,
    });
    setShowForm(true);
  };

  // Handle delete product
  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setError(null);
      const result = await AdminProductService.deleteProduct(productId);
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.size === 0) {
      return;
    }

    if (!confirm(`Are you sure you want to ${bulkAction} ${selectedProducts.size} products?`)) {
      return;
    }

    try {
      setError(null);
      
      const productIds = Array.from(selectedProducts);
      
      if (bulkAction === 'delete') {
        // Bulk soft delete (set isActive to false)
        await AdminProductService.bulkUpdateProducts(productIds, { isActive: false });
      } else if (bulkAction === 'activate') {
        await AdminProductService.bulkUpdateProducts(productIds, { isActive: true });
      } else if (bulkAction === 'deactivate') {
        await AdminProductService.bulkUpdateProducts(productIds, { isActive: false });
      }

      setSelectedProducts(new Set());
      setBulkAction('');
      await loadProducts();
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    }
  };

  // Handle product selection
  const handleProductSelect = (productId: string, selected: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (selected) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProducts(new Set(products.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  // Handle image upload with S3 integration
  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    
    try {
      setError(null);
      const fileArray = Array.from(files);
      
      // Upload images to S3
      const uploadedUrls = await AdminProductService.uploadProductImages(
        fileArray, 
        editingProduct?.id
      );
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    }
  };

  // Remove image
  const removeImage = async (index: number) => {
    const imageToRemove = formData.images[index];
    
    // If this is an existing image (has a full URL), we'll handle cleanup during save
    // For now, just remove from the form state
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your silver mangalsutra catalog</p>
        </div>
        <PermissionGate resource="admin/products" action="create">
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData(initialFormData);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Product</span>
          </button>
        </PermissionGate>
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

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="traditional">Traditional</option>
              <option value="modern">Modern</option>
              <option value="designer">Designer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadProducts}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedProducts.size} products selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as any)}
                className="px-3 py-1 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Action</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Apply Action
              </button>
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={product.images[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.style}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.category === 'traditional' ? 'bg-green-100 text-green-800' :
                        product.category === 'modern' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <PermissionGate resource="admin/products" action="update">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        </PermissionGate>
                        <PermissionGate resource="admin/inventory" action="update">
                          <button
                            onClick={() => setShowInventoryManager(product.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Inventory
                          </button>
                        </PermissionGate>
                        <PermissionGate resource="admin/products" action="delete">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="traditional">Traditional</option>
                        <option value="modern">Modern</option>
                        <option value="designer">Designer</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Product Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Weight (grams)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Length (inches)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.length}
                        onChange={(e) => setFormData(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                    <input
                      type="text"
                      value={formData.style}
                      onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occasions (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.occasion.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        occasion: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                      }))}
                      placeholder="Wedding, Festival, Daily Wear"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      Product is active and visible to customers
                    </label>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Product Images</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload multiple images. Images will be stored in AWS S3 via Amplify Storage. First image will be the main product image.</p>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SEO */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">SEO Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                    <textarea
                      rows={2}
                      value={formData.metaDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.keywords.join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        keywords: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                      }))}
                      placeholder="traditional, silver, mangalsutra"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Manager Modal */}
      {showInventoryManager && (
        <ProductInventoryManager
          productId={showInventoryManager}
          onClose={() => setShowInventoryManager(null)}
        />
      )}
    </div>
  );
}