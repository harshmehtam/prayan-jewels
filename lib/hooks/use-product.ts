'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { ReviewCache } from '@/lib/utils/review-cache';
import type { Product } from '@/types';

const client = generateClient<Schema>();

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

export function useProduct(productId: string): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product using Amplify client
        const { data, errors } = await client.models.Product.get({ 
          id: productId 
        });

        if (errors) {
          console.error('Error fetching product:', errors);
          setError('Failed to load product');
          return;
        }

        if (!data) {
          setError('Product not found');
          return;
        }

        // Get review stats
        const stats = await ReviewCache.getProductReviewStats(productId);

        // Transform to Product type
        const transformedProduct: Product = {
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          actualPrice: data.actualPrice,
          images: data.images?.filter((img: string | null): img is string => img !== null) || [],
          isActive: data.isActive,
          viewCount: data.viewCount,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          averageRating: stats.averageRating > 0 ? stats.averageRating : null,
          totalReviews: stats.totalReviews > 0 ? stats.totalReviews : null,
        };

        setProduct(transformedProduct);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  return { product, loading, error };
}
