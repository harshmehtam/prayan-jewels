// Mock product data for UI development
import type { Product, ProductSearchResult, ProductFilters } from '@/types';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Silver Alluring Mangalsutra',
    description: 'The Inspiration: The Silver Alluring Mangalsutra is inspired by the beauty of stars and their shine that brightens up the day of whoever looks up at the sky. The Design: The silver mangalsutra has pear-shaped zircon embellishments on the centre. 925 Silver, Adjustable size to ensure no fitting issues, AAA+ Quality Zircons, Length of necklace is 44 cm with 5cm adjustable portion, Dimensions: 4.3 cm x 0.8 cm, Rhodium finish to prevent tarnish, Comes with the GIVA Jewellery kit and authenticity certificate.',
    price: 2499,
    images: [
      '/placeholder-product.svg',
      '/placeholder-product.svg',
      '/placeholder-product.svg'
    ],
    isActive: true,
    averageRating: 4.8,
    totalReviews: 124,
    viewCount: 1250,
    purchaseCount: 89,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Golden Elegance Mangalsutra',
    description: 'The Inspiration: Inspired by traditional Indian craftsmanship and modern elegance. The Design: Features intricate gold work with delicate patterns and premium finish. 22k Gold Plated, Traditional design with contemporary appeal, Adjustable chain 42-46 cm, Handcrafted details, Anti-tarnish coating, Comes with premium packaging and care instructions.',
    price: 3299,
    images: [
      '/placeholder-product.svg',
      '/placeholder-product.svg'
    ],
    isActive: true,
    averageRating: 4.6,
    totalReviews: 87,
    viewCount: 980,
    purchaseCount: 56,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z'
  },
  {
    id: '3',
    name: 'Royal Heritage Mangalsutra',
    description: 'The Inspiration: Drawing from royal Indian heritage and timeless traditions. The Design: Elaborate design with multiple pendants and intricate chain work. Premium 925 Silver with gold plating, Royal design elements, Multiple pendant layers, Length 45 cm with extension, Heirloom quality craftsmanship, Comes with authenticity certificate and luxury box.',
    price: 4599,
    images: [
      '/placeholder-product.svg',
      '/placeholder-product.svg',
      '/placeholder-product.svg'
    ],
    isActive: true,
    averageRating: 4.9,
    totalReviews: 156,
    viewCount: 1890,
    purchaseCount: 112,
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z'
  }
];

export class MockProductService {
  static async getProducts(
    filters: ProductFilters = {},
    limit: number = 20
  ): Promise<ProductSearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    let filteredProducts = [...mockProducts];

    // Apply filters
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    if (filters.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.price <= filters.maxPrice!);
    }

    if (filters.inStock !== undefined) {
      // For mock data, assume all products are in stock
      if (filters.inStock) {
        filteredProducts = filteredProducts.filter(product => product.isActive);
      }
    }

    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'name':
          filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'newest':
          filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'popularity':
          filteredProducts.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
          break;
        case 'rating':
          filteredProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          break;
      }
    }

    // Apply limit
    const limitedProducts = filteredProducts.slice(0, limit);

    return {
      products: limitedProducts,
      totalCount: filteredProducts.length,
      hasNextPage: filteredProducts.length > limit,
      suggestions: filteredProducts.length === 0 ? ['mangalsutra', 'silver', 'gold'] : undefined,
      popularProducts: filteredProducts.length === 0 ? mockProducts.slice(0, 3) : undefined,
    };
  }

  static async getProductById(id: string): Promise<Product | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return mockProducts.find(product => product.id === id) || null;
  }
}