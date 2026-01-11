'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Product, CreateProductInput, UpdateProductInput } from '@/types';
import { AdminProductService } from '@/lib/services/admin-products';
import { SimpleImageService } from '@/lib/services/simple-image-service';
import { validateImageFiles } from '@/lib/utils/image-utils';
import { validatePrices } from '@/lib/utils/price-utils';
import ProductInventoryManager from './ProductInventoryManager';
import { PermissionGate } from '@/components/auth/AdminRoute';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { LoadingSpinner, CachedAmplifyImage } from '@/components/ui';

// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 rounded-lg min-h-[200px] p-4 bg-gray-50">
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading editor...
      </div>
    </div>
  ),
});

// Fallback simple rich text editor
const SimpleRichTextEditor = dynamic(() => import('@/components/ui/SimpleRichTextEditor'), {
  ssr: false,
  loading: () => (
    <textarea
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
      placeholder="Loading editor..."
      disabled
    />
  ),
});

interface AdminProductManagerProps {
  className?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  actualPrice: number;
  images: string[];
  isActive: boolean;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  actualPrice: 0,
  images: [],
  isActive: true,
};

export default function AdminProductManager({ className = '' }: AdminProductManagerProps) {
  const { isSuperAdmin } = useRoleAccess();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | 'price_update' | ''>('');
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkPriceData, setBulkPriceData] = useState({
    priceField: 'selling' as 'selling' | 'actual',
    updateType: 'percentage' as 'percentage' | 'fixed' | 'set_price',
    value: 0,
    minPrice: 0,
    maxPrice: 0,
  });
  const [showInventoryManager, setShowInventoryManager] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [useSimpleEditor, setUseSimpleEditor] = useState(false);
  const [priceValidationError, setPriceValidationError] = useState<string | null>(null);
  
  // Store blob URLs with metadata to prevent premature cleanup
  const [imageBlobs, setImageBlobs] = useState<Map<string, { 
    url: string; 
    file: File; 
    finalPath: string; 
    originalName: string; 
  }>>(new Map());

  const loadingRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Load products with proper duplicate prevention
  const loadProducts = React.useCallback(async (forceReload = false) => {
    // Prevent duplicate calls unless forced
    if (loadingRef.current && !forceReload) {
      console.log('🚫 Skipping duplicate loadProducts call');
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const filters = {
        searchQuery: searchQuery || undefined,
        // Only add timestamp for force reload to prevent unnecessary cache busting
        ...(forceReload && { _forceReload: Date.now() }),
      };

      console.log('🔍 Loading products with filters:', filters);
      const result = await AdminProductService.getProducts(filters, 100);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🚫 Request was aborted');
        return;
      }

      let filteredProducts = result.products.map((product: any) => ({
        ...product,
        images: product.images?.filter((img: any): img is string => img !== null) || [],
      }));

      // Apply status filter
      if (statusFilter === 'active') {
        filteredProducts = filteredProducts.filter((p: any) => p.isActive);
      } else if (statusFilter === 'inactive') {
        filteredProducts = filteredProducts.filter((p: any) => !p.isActive);
      }

      setProducts(filteredProducts);
      console.log('✅ Products loaded successfully:', filteredProducts.length);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🚫 Request was aborted');
        return;
      }
      console.error('❌ Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [searchQuery, statusFilter]); // Remove unnecessary dependencies

  // Single useEffect for all data loading with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [loadProducts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      loadingRef.current = false;
      
      // Cleanup any object URLs
      imageBlobs.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imageBlobs]);

  // Store selected files for S3 upload (simplified)
  const [uploadProgress, setUploadProgress] = useState<{
    uploading: boolean;
    completed: number;
    total: number;
    currentFile: string;
  }>({
    uploading: false,
    completed: 0,
    total: 0,
    currentFile: '',
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate prices
      const priceValidation = validatePrices(formData.price, formData.actualPrice);
      if (!priceValidation.isValid) {
        setError(priceValidation.error!);
        setSubmitting(false);
        return;
      }
      // Convert image IDs to final storage paths (not blob URLs)
      const imageUrls = formData.images.map((imageId) => {
        const blobData = imageBlobs.get(imageId);
        if (blobData) {
          // Use the final path that will be stored in the database
          return blobData.finalPath;
        }
        return imageId; // Fallback to imageId if it's already a URL (for existing products)
      });

      const submissionData = {
        ...formData,
        images: imageUrls
      };

      console.log('Submitting product with data:', submissionData);

      // Upload images to S3
      setUploadProgress({ uploading: true, completed: 0, total: 0, currentFile: '' });
      
      const filesToUpload = formData.images
        .map(imageId => imageBlobs.get(imageId)?.file)
        .filter((file): file is File => file !== undefined);

      let uploadedPaths: string[] = [];
      
      if (filesToUpload.length > 0) {
        console.log(`📤 Uploading ${filesToUpload.length} images to Amplify Storage...`);
        
        try {
          uploadedPaths = await SimpleImageService.uploadImages(
            filesToUpload,
            'product-images',
            (progress) => {
              setUploadProgress({
                uploading: true,
                completed: progress.completed,
                total: progress.total,
                currentFile: progress.currentFile,
              });
            }
          );
          
          console.log('✅ All images uploaded successfully:', uploadedPaths);
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          throw new Error(`Failed to upload images: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      // Handle existing images (for updates)
      const existingImagePaths = formData.images
        .map(imageId => {
          const blobData = imageBlobs.get(imageId);
          return blobData?.file ? null : imageId; // If no file, it's an existing path
        })
        .filter((path): path is string => path !== null);

      const finalImagePaths = [...existingImagePaths, ...uploadedPaths];

      const finalSubmissionData = {
        ...submissionData,
        images: finalImagePaths
      };

      setUploadProgress({ uploading: false, completed: 0, total: 0, currentFile: '' });

      let savedProduct;
      if (editingProduct) {
        // Update existing product
        const updateData: UpdateProductInput = {
          id: editingProduct.id,
          ...finalSubmissionData,
        };

        const result = await AdminProductService.updateProduct(updateData);
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
        savedProduct = result.product;
        console.log('Product updated successfully:', savedProduct);
      } else {
        // Create new product
        const createData: CreateProductInput = finalSubmissionData;
        const result = await AdminProductService.createProduct(createData);
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
        savedProduct = result.product;
        console.log('Product created successfully:', savedProduct);
      }

      // Reset form and reload products
      resetForm();
      
      // Add a small delay to ensure backend has processed the request
      console.log('Waiting for backend to process...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force reload products to ensure the new product appears
      console.log('Reloading products...');
      await loadProducts(true);
      
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
    
    // For existing products, images are already URLs, so we can use them directly
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      actualPrice: product.actualPrice || 0,
      images: product.images, // These are already URLs, not blob IDs
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
      loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  // Helper function to strip HTML tags for display
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Handle bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.size === 0) {
      return;
    }

    if (bulkAction === 'price_update') {
      setShowBulkPriceModal(true);
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
      loadProducts();
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    }
  };

  // Handle bulk price update
  const handleBulkPriceUpdate = async () => {
    // Validate input based on update type
    if (selectedProducts.size === 0) {
      setError('Please select products');
      return;
    }

    if (bulkPriceData.updateType === 'set_price' && bulkPriceData.value <= 0) {
      setError('Please enter a valid price (must be greater than 0)');
      return;
    }

    if ((bulkPriceData.updateType === 'percentage' || bulkPriceData.updateType === 'fixed') && bulkPriceData.value === 0) {
      setError('Please enter a non-zero value');
      return;
    }

    // Get selected products data from current state (no API calls needed)
    const selectedProductsList = products.filter(p => selectedProducts.has(p.id));
    
    // Validate price constraints
    const priceRange = {
      min: bulkPriceData.minPrice > 0 ? bulkPriceData.minPrice : undefined,
      max: bulkPriceData.maxPrice > 0 ? bulkPriceData.maxPrice : undefined,
    };

    if (priceRange.min || priceRange.max) {
      const filteredProducts = selectedProductsList.filter(p => {
        const withinMin = !priceRange.min || p.price >= priceRange.min;
        const withinMax = !priceRange.max || p.price <= priceRange.max;
        return withinMin && withinMax;
      });

      if (filteredProducts.length === 0) {
        setError('No products match the price range criteria');
        return;
      }

      if (filteredProducts.length < selectedProductsList.length) {
        const message = `Only ${filteredProducts.length} out of ${selectedProductsList.length} selected products match the price range. Continue?`;
        if (!confirm(message)) {
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      // Show confirmation with price preview
      const previewProducts = selectedProductsList
        .filter(p => {
          const withinMin = !priceRange.min || p.price >= priceRange.min;
          const withinMax = !priceRange.max || p.price <= priceRange.max;
          return withinMin && withinMax;
        })
        .slice(0, 5);

      const previewText = previewProducts.map(product => {
        let newPrice: number;
        switch (bulkPriceData.updateType) {
          case 'percentage':
            newPrice = product.price * (1 + bulkPriceData.value / 100);
            break;
          case 'fixed':
            newPrice = product.price + bulkPriceData.value;
            break;
          case 'set_price':
            newPrice = bulkPriceData.value;
            break;
          default:
            newPrice = product.price;
        }
        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
        return `${product.name.substring(0, 30)}...: ₹${product.price} → ₹${newPrice}`;
      }).join('\n');
      
      const confirmMessage = `Update prices for selected products?\n\nPreview:\n${previewText}${previewProducts.length < selectedProductsList.length ? '\n...and more' : ''}`;
      
      if (!confirm(confirmMessage)) {
        return;
      }

      console.log(`🚀 Starting bulk price update for ${selectedProductsList.length} products...`);

      // Use the ultra-optimized single-call bulk price update method
      // Pass the product data we already have instead of just IDs
      const productsForUpdate = selectedProductsList.map(p => ({
        id: p.id,
        price: p.price,
        actualPrice: p.actualPrice || undefined,
        name: p.name
      }));

      const result = await AdminProductService.bulkUpdatePricesSingleCall(
        productsForUpdate,
        bulkPriceData.priceField,
        bulkPriceData.updateType,
        bulkPriceData.value,
        priceRange.min || priceRange.max ? priceRange : undefined
      );

      if (result.errors && result.errors.length > 0) {
        setError(result.errors[0].message);
      } else {
        const message = `Successfully updated ${result.successful.length} products` + 
          (result.skipped > 0 ? `, skipped ${result.skipped} products` : '') +
          (result.failed > 0 ? `, ${result.failed} failed` : '');
        
        console.log(`✅ ${message}`);
        
        // Show success message to user (you could replace this with a toast notification)
        if (result.failed === 0) {
          // Temporary success indication - you might want to add a proper toast system
          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
          successDiv.textContent = message;
          document.body.appendChild(successDiv);
          setTimeout(() => document.body.removeChild(successDiv), 3000);
        }
      }

      // Reset and reload
      setSelectedProducts(new Set());
      setBulkAction('');
      setShowBulkPriceModal(false);
      setBulkPriceData({
        priceField: 'selling',
        updateType: 'percentage',
        value: 0,
        minPrice: 0,
        maxPrice: 0,
      });
      
      // Force reload to get updated data
      console.log('🔄 Reloading products to reflect changes...');
      await loadProducts(true);
      
    } catch (err) {
      console.error('❌ Error updating prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to update prices');
    } finally {
      setSubmitting(false);
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

  // Handle image upload - create preview URLs and store files for S3 upload
  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;

    try {
      setError(null);
      const fileArray = Array.from(files);

      // Validate files with WebP enforcement
      const validation = validateImageFiles(fileArray);
      
      if (validation.invalid.length > 0) {
        const errorMessages = validation.invalid.map(({ file, error }) => `${file.name}: ${error}`);
        setError(`Invalid files:\n${errorMessages.join('\n')}`);
      }

      if (validation.warnings.length > 0) {
        const warningMessages = validation.warnings.map(({ file, warnings }) => 
          `${file.name}: ${warnings.join(', ')}`
        );
        console.warn('File warnings:', warningMessages);
      }

      if (validation.valid.length === 0) {
        setError('No valid image files selected');
        return;
      }

      // Create preview URLs and store files
      const newBlobs = new Map(imageBlobs);
      const imageData = validation.valid.map((file) => {
        const url = URL.createObjectURL(file);
        const id = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        newBlobs.set(id, { 
          url, 
          file, 
          finalPath: '', // Will be set after S3 upload
          originalName: file.name 
        });
        
        return id;
      });

      setImageBlobs(newBlobs);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageData]
      }));

      console.log(`✅ ${validation.valid.length} files ready for WebP conversion and upload`);
      if (validation.invalid.length > 0) {
        console.warn(`❌ ${validation.invalid.length} files rejected`);
      }

    } catch (err) {
      console.error('Error processing images:', err);
      setError(err instanceof Error ? err.message : 'Failed to process images');
    }
  };

  // Cleanup function for object URLs
  const cleanupImageUrls = (imageIds: string[]) => {
    imageIds.forEach(id => {
      const blobData = imageBlobs.get(id);
      if (blobData) {
        URL.revokeObjectURL(blobData.url);
        imageBlobs.delete(id);
      }
    });
    setImageBlobs(new Map(imageBlobs));
  };

  // Reset form and cleanup
  const resetForm = () => {
    cleanupImageUrls(formData.images);
    setFormData(initialFormData);
    setEditingProduct(null);
    setShowForm(false);
    setUploadProgress({ uploading: false, completed: 0, total: 0, currentFile: '' });
  };

  // Remove image and clean up object URL
  const removeImage = (index: number) => {
    setFormData(prev => {
      const imageId = prev.images[index];
      const blobData = imageBlobs.get(imageId);
      if (blobData) {
        URL.revokeObjectURL(blobData.url);
        const newBlobs = new Map(imageBlobs);
        newBlobs.delete(imageId);
        setImageBlobs(newBlobs);
      }
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      };
    });
  };

  // Handle drag and drop reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    setDraggedIndex(null);
    
    if (dragIndex !== dropIndex && dragIndex !== null) {
      moveImage(dragIndex, dropIndex);
    }
  };

  // Move image up or down in the array
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setFormData(prev => {
      const newImages = [...prev.images];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return {
        ...prev,
        images: newImages
      };
    });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onClick={() => loadProducts(true)}
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
                <option value="price_update">Update Prices</option>
                {/* Only superadmin can perform bulk delete */}
                {isSuperAdmin && <option value="delete">Delete</option>}
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
                          <CachedAmplifyImage
                            path={product.images[0] || ''}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {stripHtml(product.description).substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <div className="font-medium">₹{product.price.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Selling Price</div>
                        {product.actualPrice && product.actualPrice > 0 && (
                          <>
                            <div className="text-xs text-gray-400 line-through">₹{product.actualPrice.toLocaleString()}</div>
                            <div className="text-xs text-green-600">
                              {Math.round(((product.actualPrice - product.price) / product.actualPrice) * 100)}% off
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

      {/* Bulk Price Update Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Bulk Price Update ({selectedProducts.size} products)
              </h3>
              <button
                onClick={() => {
                  setShowBulkPriceModal(false);
                  setBulkAction('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Price Field Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Field to Update</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="priceField"
                      value="selling"
                      checked={bulkPriceData.priceField === 'selling'}
                      onChange={(e) => setBulkPriceData(prev => ({ ...prev, priceField: e.target.value as any }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Selling Price</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="priceField"
                      value="actual"
                      checked={bulkPriceData.priceField === 'actual'}
                      onChange={(e) => setBulkPriceData(prev => ({ ...prev, priceField: e.target.value as any }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Actual Price</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selling Price: What customers pay. Actual Price: Original/MRP price for showing discounts.
                </p>
              </div>

              {/* Update Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="updateType"
                      value="percentage"
                      checked={bulkPriceData.updateType === 'percentage'}
                      onChange={(e) => setBulkPriceData(prev => ({ ...prev, updateType: e.target.value as any }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Percentage</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="updateType"
                      value="fixed"
                      checked={bulkPriceData.updateType === 'fixed'}
                      onChange={(e) => setBulkPriceData(prev => ({ ...prev, updateType: e.target.value as any }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Fixed Amount</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="updateType"
                      value="set_price"
                      checked={bulkPriceData.updateType === 'set_price'}
                      onChange={(e) => setBulkPriceData(prev => ({ ...prev, updateType: e.target.value as any }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Set Price</span>
                  </label>
                </div>
              </div>

              {/* Value Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {bulkPriceData.updateType === 'percentage' && 'Percentage Change (%)'}
                  {bulkPriceData.updateType === 'fixed' && 'Amount to Add/Subtract (₹)'}
                  {bulkPriceData.updateType === 'set_price' && 'New Price (₹)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bulkPriceData.value}
                  onChange={(e) => setBulkPriceData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    bulkPriceData.updateType === 'percentage' ? 'e.g., 10 for 10% increase, -5 for 5% decrease' :
                    bulkPriceData.updateType === 'fixed' ? 'e.g., 100 to add ₹100, -50 to subtract ₹50' :
                    'e.g., 1500 to set all prices to ₹1500'
                  }
                  {...(bulkPriceData.updateType === 'set_price' && { min: "0" })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {bulkPriceData.updateType === 'percentage' && 'Positive values increase prices, negative values decrease them'}
                  {bulkPriceData.updateType === 'fixed' && 'Positive values add to current price, negative values subtract'}
                  {bulkPriceData.updateType === 'set_price' && 'All selected products will be set to this price'}
                </p>
              </div>

              {/* Price Range Filters */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Optional: Apply only to products within price range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Minimum Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bulkPriceData.minPrice}
                      onChange={(e) => setBulkPriceData(prev => ({ ...prev, minPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0 (no minimum)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Maximum Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bulkPriceData.maxPrice}
                      onChange={(e) => setBulkPriceData(prev => ({ ...prev, maxPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="0 (no maximum)"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leave empty to apply to all selected products. Use range to target specific price segments.
                </p>
              </div>

              {/* Preview */}
              {bulkPriceData.value > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Preview (first 3 products)</h4>
                  <div className="space-y-1">
                    {products
                      .filter(p => selectedProducts.has(p.id))
                      .filter(p => {
                        const currentPrice = bulkPriceData.priceField === 'selling' ? p.price : (p.actualPrice || 0);
                        const withinMin = bulkPriceData.minPrice <= 0 || currentPrice >= bulkPriceData.minPrice;
                        const withinMax = bulkPriceData.maxPrice <= 0 || currentPrice <= bulkPriceData.maxPrice;
                        return withinMin && withinMax;
                      })
                      .slice(0, 3)
                      .map(product => {
                        const currentPrice = bulkPriceData.priceField === 'selling' ? product.price : (product.actualPrice || 0);
                        let newPrice: number;
                        switch (bulkPriceData.updateType) {
                          case 'percentage':
                            newPrice = currentPrice * (1 + bulkPriceData.value / 100);
                            break;
                          case 'fixed':
                            newPrice = currentPrice + bulkPriceData.value;
                            break;
                          case 'set_price':
                            newPrice = bulkPriceData.value;
                            break;
                          default:
                            newPrice = currentPrice;
                        }
                        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
                        
                        return (
                          <div key={product.id} className="text-xs text-blue-800">
                            <span className="font-medium">{product.name.substring(0, 30)}...</span>
                            <span className="ml-2">
                              {bulkPriceData.priceField === 'selling' ? 'Selling' : 'Actual'}: ₹{currentPrice} → ₹{newPrice}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkPriceModal(false);
                    setBulkAction('');
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkPriceUpdate}
                  disabled={submitting || (bulkPriceData.updateType === 'set_price' ? bulkPriceData.value <= 0 : bulkPriceData.value === 0)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  <span>{submitting ? 'Updating...' : 'Update Prices'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Product Information</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Silver Alluring Mangalsutra"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complete Description *
                  </label>
                  {useSimpleEditor ? (
                    <SimpleRichTextEditor
                      value={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      required
                    />
                  ) : (
                    <RichTextEditor
                      value={formData.description}
                      onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                      required
                    />
                  )}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setUseSimpleEditor(!useSimpleEditor)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {useSimpleEditor ? 'Switch to Advanced Editor' : 'Switch to Simple Editor'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => {
                        const newPrice = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, price: newPrice }));
                        
                        // Validate prices in real-time
                        const validation = validatePrices(newPrice, formData.actualPrice);
                        setPriceValidationError(validation.isValid ? null : validation.error!);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Customer pays this price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Actual Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.actualPrice || ''}
                      onChange={(e) => {
                        const newActualPrice = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, actualPrice: newActualPrice }));
                        
                        // Validate prices in real-time
                        const validation = validatePrices(formData.price, newActualPrice);
                        setPriceValidationError(validation.isValid ? null : validation.error!);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Original/MRP price (optional)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>To show discount:</strong> Set this higher than selling price. Leave empty if no discount.
                    </p>
                    {formData.price > 0 && formData.actualPrice > 0 && formData.actualPrice > formData.price && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        ✓ Discount: {Math.round(((formData.actualPrice - formData.price) / formData.actualPrice) * 100)}% OFF (Save ₹{(formData.actualPrice - formData.price).toLocaleString()})
                      </p>
                    )}
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
                
                {/* Price Validation Error */}
                {priceValidationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex">
                      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{priceValidationError}</p>
                      </div>
                    </div>
                  </div>
                )}
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
                    <p className="text-xs text-gray-500 mt-1">
                      Select multiple images to upload. All formats supported (JPG, PNG, etc.) - converted to WebP automatically (max 5MB each).
                    </p>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700 font-medium">
                          Image Preview ({formData.images.length} image{formData.images.length !== 1 ? 's' : ''})
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            cleanupImageUrls(formData.images);
                            setFormData(prev => ({ ...prev, images: [] }));
                          }}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {formData.images.map((imageId, index) => {
                          const blobData = imageBlobs.get(imageId);
                          const isNewUpload = !!blobData;
                          const imageUrl = isNewUpload ? blobData.url : imageId;

                          return (
                            <div key={imageId} className="relative group">
                              <div className="w-full h-32 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                {isNewUpload ? (
                                  <img
                                    src={imageUrl}
                                    alt={`Product image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <CachedAmplifyImage
                                    path={imageId}
                                    alt={`Product image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove image"
                              >
                                ×
                              </button>
                              
                              {/* Main image indicator */}
                              {index === 0 && (
                                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow">
                                  Main Image
                                </div>
                              )}
                              
                              {/* Image number */}
                              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                                {index + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting || uploadProgress.uploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadProgress.uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {(submitting || uploadProgress.uploading) && <LoadingSpinner size="sm" />}
                  <span>
                    {uploadProgress.uploading 
                      ? `Uploading ${uploadProgress.completed}/${uploadProgress.total}...`
                      : submitting 
                        ? 'Saving...'
                        : editingProduct 
                          ? 'Update Product' 
                          : 'Create Product'
                    }
                  </span>
                </button>
              </div>

              {/* Upload Progress */}
              {uploadProgress.uploading && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Uploading Images to S3
                    </span>
                    <span className="text-sm text-blue-700">
                      {uploadProgress.completed}/{uploadProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${uploadProgress.total > 0 ? (uploadProgress.completed / uploadProgress.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  {uploadProgress.currentFile && (
                    <p className="text-xs text-blue-600">
                      Current: {uploadProgress.currentFile}
                    </p>
                  )}
                </div>
              )}
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