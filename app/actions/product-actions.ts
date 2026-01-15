'use server';

import { revalidatePath } from 'next/cache';
import * as productService from '@/lib/services/product-service';
import type { Product, ProductSearchResult, ProductFilters } from '@/types';

/**
 * Get products with filtering, sorting, and pagination
 */
export async function getProducts(
  filters: ProductFilters = {},
  limit: number = 20,
  nextToken?: string
): Promise<ProductSearchResult> {
  try {
    return await productService.getProducts(filters, limit, nextToken);
  } catch (error) {
    console.error('Error getting products:', error);
    return {
      products: [],
      totalCount: 0,
      hasNextPage: false,
      nextToken: undefined,
    };
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    return await productService.getProductById(id);
  } catch (error) {
    console.error('Error getting product:', error);
    return null;
  }
}

/**
 * Get multiple products by IDs (for checkout page)
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  try {
    return await productService.getProductsByIds(ids);
  } catch (error) {
    console.error('Error getting products by IDs:', error);
    return [];
  }
}

/**
 * Get products by price range
 */
export async function getProductsByPriceRange(
  maxPrice: number,
  limit: number = 12
): Promise<Product[]> {
  try {
    return await productService.getProductsByPriceRange(maxPrice, limit);
  } catch (error) {
    console.error('Error getting products by price range:', error);
    return [];
  }
}

/**
 * Increment product view count (for product detail pages)
 */
export async function incrementProductViewCount(productId: string): Promise<void> {
  try {
    await productService.incrementProductViewCount(productId);
    revalidatePath(`/products/${productId}`);
    revalidatePath('/products');
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

/**
 * Clear product cache (for admin updates)
 */
export async function clearProductCache(productId?: string): Promise<void> {
  try {
    productService.clearProductCache(productId);
    revalidatePath('/products');
    if (productId) {
      revalidatePath(`/products/${productId}`);
    }
  } catch (error) {
    console.error('Error clearing product cache:', error);
  }
}
