// Mock product data for UI development
import type { Product, ProductSearchResult, ProductFilters } from '@/types';

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'November Birthstone Chain Necklace',
    description: 'Elegant gold chain necklace with November birthstone pendant',
    price: 99,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop'
    ],
    category: 'modern',
    material: 'gold',
    weight: 15,
    length: 18,
    style: 'chain',
    occasion: ['casual', 'formal'],
    isActive: true,
    averageRating: 4.1,
    totalReviews: 15,
    popularityScore: 85,
    viewCount: 120,
    purchaseCount: 8,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'December Birthstone Locket Necklace',
    description: 'Beautiful turquoise locket necklace perfect for December birthdays',
    price: 158,
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop'
    ],
    category: 'traditional',
    material: 'gold',
    weight: 22,
    length: 20,
    style: 'locket',
    occasion: ['formal', 'special'],
    isActive: true,
    averageRating: 4.7,
    totalReviews: 67,
    popularityScore: 92,
    viewCount: 245,
    purchaseCount: 23,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '3',
    name: 'Fine Chain Necklace 22\'',
    description: 'Delicate fine chain necklace in premium gold vermeil',
    price: 80,
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop'
    ],
    category: 'modern',
    material: 'gold',
    weight: 12,
    length: 22,
    style: 'chain',
    occasion: ['casual', 'everyday'],
    isActive: true,
    averageRating: 4.6,
    totalReviews: 47,
    popularityScore: 78,
    viewCount: 189,
    purchaseCount: 15,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: '4',
    name: 'January Birthstone Locket Necklace',
    description: 'Stunning red onyx locket necklace for January birthstone',
    price: 158,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop'
    ],
    category: 'traditional',
    material: 'gold',
    weight: 25,
    length: 18,
    style: 'locket',
    occasion: ['formal', 'special'],
    isActive: true,
    averageRating: 4.8,
    totalReviews: 66,
    popularityScore: 95,
    viewCount: 298,
    purchaseCount: 31,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z'
  },
  {
    id: '5',
    name: 'Pearl Drop Earrings',
    description: 'Classic pearl drop earrings with gold accents',
    price: 125,
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=400&h=400&fit=crop'
    ],
    category: 'traditional',
    material: 'gold',
    weight: 8,
    style: 'drop',
    occasion: ['formal', 'wedding'],
    isActive: true,
    averageRating: 4.5,
    totalReviews: 32,
    popularityScore: 82,
    viewCount: 156,
    purchaseCount: 12,
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z'
  },
  {
    id: '6',
    name: 'Diamond Stud Earrings',
    description: 'Brilliant cut diamond stud earrings in white gold',
    price: 299,
    images: [
      'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop'
    ],
    category: 'designer',
    material: 'white gold',
    weight: 5,
    style: 'stud',
    occasion: ['formal', 'everyday'],
    isActive: true,
    averageRating: 4.9,
    totalReviews: 89,
    popularityScore: 98,
    viewCount: 445,
    purchaseCount: 42,
    createdAt: '2024-01-08T10:00:00Z',
    updatedAt: '2024-01-08T10:00:00Z'
  },
  {
    id: '7',
    name: 'Rose Gold Tennis Bracelet',
    description: 'Elegant rose gold tennis bracelet with cubic zirconia',
    price: 189,
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop'
    ],
    category: 'modern',
    material: 'rose gold',
    weight: 18,
    length: 7,
    style: 'tennis',
    occasion: ['formal', 'special'],
    isActive: true,
    averageRating: 4.3,
    totalReviews: 28,
    popularityScore: 75,
    viewCount: 134,
    purchaseCount: 9,
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z'
  },
  {
    id: '8',
    name: 'Vintage Charm Bracelet',
    description: 'Antique-style charm bracelet with multiple pendants',
    price: 145,
    images: [
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop'
    ],
    category: 'traditional',
    material: 'silver',
    weight: 35,
    length: 8,
    style: 'charm',
    occasion: ['casual', 'vintage'],
    isActive: true,
    averageRating: 4.4,
    totalReviews: 19,
    popularityScore: 68,
    viewCount: 98,
    purchaseCount: 6,
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z'
  },
  {
    id: '9',
    name: 'Sapphire Cocktail Ring',
    description: 'Statement sapphire cocktail ring in yellow gold',
    price: 275,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop'
    ],
    category: 'designer',
    material: 'yellow gold',
    weight: 12,
    style: 'cocktail',
    occasion: ['formal', 'party'],
    isActive: true,
    averageRating: 4.7,
    totalReviews: 41,
    popularityScore: 88,
    viewCount: 201,
    purchaseCount: 18,
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z'
  },
  {
    id: '10',
    name: 'Simple Gold Band Ring',
    description: 'Classic simple gold band ring for everyday wear',
    price: 65,
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop'
    ],
    category: 'modern',
    material: 'gold',
    weight: 6,
    style: 'band',
    occasion: ['everyday', 'casual'],
    isActive: true,
    averageRating: 4.2,
    totalReviews: 24,
    popularityScore: 72,
    viewCount: 167,
    purchaseCount: 14,
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: '2024-01-25T10:00:00Z'
  },
  {
    id: '11',
    name: 'Emerald Pendant Necklace',
    description: 'Beautiful emerald pendant on delicate gold chain',
    price: 220,
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop'
    ],
    category: 'designer',
    material: 'gold',
    weight: 16,
    length: 16,
    style: 'pendant',
    occasion: ['formal', 'special'],
    isActive: true,
    averageRating: 4.6,
    totalReviews: 35,
    popularityScore: 86,
    viewCount: 178,
    purchaseCount: 16,
    createdAt: '2024-01-11T10:00:00Z',
    updatedAt: '2024-01-11T10:00:00Z'
  },
  {
    id: '12',
    name: 'Hoop Earrings Set',
    description: 'Set of three different sized gold hoop earrings',
    price: 95,
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=400&h=400&fit=crop'
    ],
    category: 'modern',
    material: 'gold',
    weight: 10,
    style: 'hoop',
    occasion: ['casual', 'everyday'],
    isActive: true,
    averageRating: 4.4,
    totalReviews: 52,
    popularityScore: 79,
    viewCount: 223,
    purchaseCount: 21,
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z'
  },
  {
    id: '13',
    name: 'Silver Chain Mangalsutra',
    description: 'Traditional silver chain mangalsutra with black beads',
    price: 245,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop'
    ],
    category: 'traditional',
    material: 'silver',
    weight: 25,
    length: 22,
    style: 'chain',
    occasion: ['wedding', 'traditional'],
    isActive: true,
    averageRating: 4.6,
    totalReviews: 89,
    popularityScore: 95,
    viewCount: 456,
    purchaseCount: 34,
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z'
  },
  {
    id: '14',
    name: 'Gold Plated Mangalsutra',
    description: 'Elegant gold plated mangalsutra with intricate design',
    price: 189,
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop'
    ],
    category: 'modern',
    material: 'gold',
    weight: 18,
    length: 20,
    style: 'pendant',
    occasion: ['daily', 'formal'],
    isActive: true,
    averageRating: 4.3,
    totalReviews: 67,
    popularityScore: 88,
    viewCount: 234,
    purchaseCount: 28,
    createdAt: '2024-01-19T10:00:00Z',
    updatedAt: '2024-01-19T10:00:00Z'
  },
  {
    id: '15',
    name: 'Designer Mangalsutra Set',
    description: 'Contemporary designer mangalsutra with matching earrings',
    price: 320,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop'
    ],
    category: 'designer',
    material: 'gold',
    weight: 30,
    length: 24,
    style: 'set',
    occasion: ['wedding', 'special'],
    isActive: true,
    averageRating: 4.8,
    totalReviews: 123,
    popularityScore: 97,
    viewCount: 567,
    purchaseCount: 45,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: '16',
    name: 'Antique Mangalsutra',
    description: 'Vintage style antique mangalsutra with traditional motifs',
    price: 275,
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop'
    ],
    category: 'traditional',
    material: 'silver',
    weight: 28,
    length: 26,
    style: 'antique',
    occasion: ['wedding', 'traditional'],
    isActive: true,
    averageRating: 4.5,
    totalReviews: 78,
    popularityScore: 91,
    viewCount: 345,
    purchaseCount: 31,
    createdAt: '2024-01-21T10:00:00Z',
    updatedAt: '2024-01-21T10:00:00Z'
  },
  {
    id: '17',
    name: 'Minimalist Mangalsutra',
    description: 'Simple and elegant minimalist mangalsutra for modern women',
    price: 156,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop'
    ],
    category: 'modern',
    material: 'gold',
    weight: 12,
    length: 18,
    style: 'minimalist',
    occasion: ['daily', 'office'],
    isActive: true,
    averageRating: 4.4,
    totalReviews: 56,
    popularityScore: 85,
    viewCount: 198,
    purchaseCount: 22,
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z'
  },
  {
    id: '18',
    name: 'Temple Jewelry Mangalsutra',
    description: 'Traditional temple jewelry style mangalsutra with goddess motifs',
    price: 298,
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop'
    ],
    category: 'traditional',
    material: 'gold',
    weight: 35,
    length: 28,
    style: 'temple',
    occasion: ['wedding', 'festival'],
    isActive: true,
    averageRating: 4.7,
    totalReviews: 94,
    popularityScore: 93,
    viewCount: 412,
    purchaseCount: 38,
    createdAt: '2024-01-23T10:00:00Z',
    updatedAt: '2024-01-23T10:00:00Z'
  }
];

export class MockProductService {
  // Helper method for sorting products
  private static sortProducts(products: Product[], sortBy: string): Product[] {
    switch (sortBy) {
      case 'price-asc':
        return [...products].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...products].sort((a, b) => b.price - a.price);
      case 'name':
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'rating':
        return [...products].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'most-relevant':
        // For most relevant, we'll use a combination of popularity and rating
        return [...products].sort((a, b) => {
          const scoreA = ((a.popularityScore || 0) * 0.6) + ((a.averageRating || 0) * 0.4);
          const scoreB = ((b.popularityScore || 0) * 0.6) + ((b.averageRating || 0) * 0.4);
          return scoreB - scoreA;
        });
      default:
        return products;
    }
  }

  // Filter products based on criteria
  private static filterProducts(products: Product[], filters?: ProductFilters): Product[] {
    let filtered = [...products];

    // Apply category filter
    if (filters?.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Apply price range filters
    if (filters?.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }

    // Apply search query filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.style?.toLowerCase().includes(query) ||
        p.occasion?.some(occ => occ.toLowerCase().includes(query))
      );
    }

    // Apply in-stock filter (for mock data, assume all are in stock)
    if (filters?.inStock) {
      // All mock products are considered in stock
      filtered = filtered.filter(p => p.isActive);
    }

    return filtered;
  }

  // Get all products with filtering and sorting
  static async getProducts(filters?: ProductFilters, limit?: number): Promise<ProductSearchResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let products = this.filterProducts(mockProducts, filters);

    // Apply sorting
    if (filters?.sortBy) {
      products = this.sortProducts(products, filters.sortBy);
    }

    // Apply limit
    if (limit) {
      products = products.slice(0, limit);
    }

    return {
      products,
      totalCount: products.length,
      hasNextPage: false,
      nextToken: undefined
    };
  }

  // Search products
  static async searchProducts(query: string, filters?: ProductFilters, limit?: number): Promise<ProductSearchResult> {
    return this.getProducts({
      ...filters,
      searchQuery: query
    }, limit);
  }

  // Get a single product by ID
  static async getProduct(id: string): Promise<{ product: Product | null; errors?: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const product = mockProducts.find(p => p.id === id);
    return {
      product: product || null
    };
  }

  // Get featured products
  static async getFeaturedProducts(limit: number = 6): Promise<{ products: Product[]; errors?: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Return highest rated products as featured
    const featured = this.sortProducts(mockProducts, 'rating').slice(0, limit);
    
    return {
      products: featured
    };
  }

  // Get products by category
  static async getProductsByCategory(category: string, limit?: number): Promise<{ products: Product[]; errors?: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    let products = mockProducts.filter(p => p.category === category && p.isActive);
    
    if (limit) {
      products = products.slice(0, limit);
    }

    return {
      products
    };
  }
}