// Product data access layer - Using Mock Data Only
import type { CreateProductInput, UpdateProductInput, ProductFilters, ProductSearchResult } from '@/types';
import { mockProducts, mockInventory } from './mock-products';

export class ProductService {
  // Get all active products with comprehensive filtering
  static async getProducts(filters?: ProductFilters, limit?: number, nextToken?: string): Promise<ProductSearchResult> {
    // Use mock data
    let products = [...mockProducts];
    
    // Apply filters
    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    
    if (filters?.minPrice !== undefined) {
      products = products.filter(p => p.price >= filters.minPrice!);
    }
    
    if (filters?.maxPrice !== undefined) {
      products = products.filter(p => p.price <= filters.maxPrice!);
    }
    
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.style?.toLowerCase().includes(query) ||
        p.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }
    
    if (filters?.inStock) {
      products = products.filter(p => (p.availableQuantity || 0) > 0);
    }
    
    // Apply limit
    const limitedProducts = products.slice(0, limit || 20);
    
    return {
      products: limitedProducts,
      totalCount: limitedProducts.length,
      hasNextPage: false
    };
  }

  // Get a single product by ID with inventory information
  static async getProduct(id: string) {
    // Use mock data
    const product = mockProducts.find(p => p.id === id);
    if (!product) {
      return { product: null, errors: null };
    }
    
    const inventory = mockInventory.find(inv => inv.productId === id);
    
    return {
      product: {
        ...product,
        inventory
      },
      errors: null
    };
  }

  // Advanced search products with autocomplete suggestions
  static async searchProducts(searchQuery: string, limit: number = 10): Promise<ProductSearchResult> {
    // Use mock data
    const query = searchQuery.toLowerCase();
    const products = mockProducts.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.style?.toLowerCase().includes(query) ||
      p.keywords?.some(k => k.toLowerCase().includes(query))
    ).slice(0, limit);
    
    return {
      products,
      totalCount: products.length,
      hasNextPage: false
    };
  }

  // Get search suggestions for autocomplete
  static async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    // Use mock data
    const suggestions = mockProducts
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .map(p => p.name)
      .slice(0, limit);
    return suggestions;
  }

  // Create a new product with inventory (mock implementation)
  static async createProduct(input: CreateProductInput) {
    // Mock implementation - just return success
    const newProduct = {
      id: `mock-${Date.now()}`,
      ...input,
      material: input.material || 'silver',
      isActive: input.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      product: newProduct,
      errors: null
    };
  }

  // Update an existing product (mock implementation)
  static async updateProduct(input: UpdateProductInput) {
    // Mock implementation - just return success
    const { id, ...updateData } = input;
    const existingProduct = mockProducts.find(p => p.id === id);
    
    if (!existingProduct) {
      return {
        product: null,
        errors: [{ message: 'Product not found' }]
      };
    }

    const updatedProduct = {
      ...existingProduct,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return {
      product: updatedProduct,
      errors: null
    };
  }

  // Delete a product (mock implementation)
  static async deleteProduct(id: string) {
    // Mock implementation - just return success
    const product = mockProducts.find(p => p.id === id);
    
    if (!product) {
      return {
        product: null,
        errors: [{ message: 'Product not found' }]
      };
    }

    return {
      product: { ...product, isActive: false },
      errors: null
    };
  }

  // Get products by category with pagination
  static async getProductsByCategory(
    category: 'traditional' | 'modern' | 'designer', 
    limit: number = 20, 
    nextToken?: string
  ): Promise<ProductSearchResult> {
    const products = mockProducts
      .filter(p => p.category === category)
      .slice(0, limit);

    return {
      products,
      totalCount: products.length,
      hasNextPage: false
    };
  }

  // Get featured products with inventory check
  static async getFeaturedProducts(limit: number = 8): Promise<any[]> {
    const products = mockProducts
      .filter(p => p.isActive)
      .map(product => ({
        ...product,
        availableQuantity: product.availableQuantity || 0
      }))
      .sort((a, b) => (b.availableQuantity || 0) - (a.availableQuantity || 0))
      .slice(0, limit);

    return products;
  }

  // Get products by price range
  static async getProductsByPriceRange(
    minPrice: number, 
    maxPrice: number, 
    limit: number = 20
  ): Promise<ProductSearchResult> {
    const products = mockProducts
      .filter(p => p.price >= minPrice && p.price <= maxPrice)
      .slice(0, limit);

    return {
      products,
      totalCount: products.length,
      hasNextPage: false
    };
  }

  // Check product availability
  static async checkProductAvailability(productId: string): Promise<{
    isAvailable: boolean;
    stockQuantity: number;
    availableQuantity: number;
  }> {
    const inventory = mockInventory.find(inv => inv.productId === productId);
    
    if (!inventory) {
      return { isAvailable: false, stockQuantity: 0, availableQuantity: 0 };
    }

    const stockQuantity = inventory.stockQuantity || 0;
    const reservedQuantity = inventory.reservedQuantity || 0;
    const availableQuantity = stockQuantity - reservedQuantity;

    return {
      isAvailable: availableQuantity > 0,
      stockQuantity,
      availableQuantity
    };
  }
}