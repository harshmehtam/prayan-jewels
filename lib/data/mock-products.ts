// Simplified mock products for testing - matches new Product interface
import type { Product, ProductSearchResult, ProductFilters } from '@/types';

const mockProducts: Product[] = [
    {
        id: '1',
        name: 'Classic Silver Mangalsutra',
        description: 'The Inspiration: A timeless design inspired by traditional Indian craftsmanship. The Design: Features elegant silver work with classic patterns. 925 Silver, Traditional design, Adjustable chain 40-44 cm, Handcrafted details, Anti-tarnish coating, Comes with authenticity certificate.',
        price: 1999,
        images: [
            '/placeholder-product.svg',
            '/placeholder-product.svg'
        ],
        isActive: true,
        averageRating: 4.5,
        totalReviews: 32,
        viewCount: 450,
        purchaseCount: 28,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z'
    },
    {
        id: '2',
        name: 'Modern Gold Mangalsutra',
        description: 'The Inspiration: Contemporary design meeting traditional values. The Design: Sleek gold finish with modern geometric patterns. 18k Gold Plated, Contemporary style, Lightweight design, Chain length 42 cm, Premium finish, Comes with elegant packaging.',
        price: 2799,
        images: [
            '/placeholder-product.svg',
            '/placeholder-product.svg'
        ],
        isActive: true,
        averageRating: 4.7,
        totalReviews: 45,
        viewCount: 680,
        purchaseCount: 38,
        createdAt: '2024-01-12T10:00:00Z',
        updatedAt: '2024-01-12T10:00:00Z'
    },
    {
        id: '3',
        name: 'Designer Diamond Mangalsutra',
        description: 'The Inspiration: Luxury meets tradition in this exquisite piece. The Design: Premium design with diamond-like zircon stones and intricate metalwork. 925 Silver with rhodium plating, AAA+ Quality zircons, Designer patterns, Adjustable 42-46 cm, Luxury finish, Comes with premium gift box.',
        price: 3999,
        images: [
            '/placeholder-product.svg',
            '/placeholder-product.svg',
            '/placeholder-product.svg'
        ],
        isActive: true,
        averageRating: 4.9,
        totalReviews: 67,
        viewCount: 920,
        purchaseCount: 52,
        createdAt: '2024-01-14T10:00:00Z',
        updatedAt: '2024-01-14T10:00:00Z'
    }
];

export class MockProductService {
    static async getProducts(filters: ProductFilters = {}, limit: number = 20): Promise<ProductSearchResult> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));

        let products = [...mockProducts];

        // Apply search filter
        if (filters?.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }

        // Apply price filters
        if (filters?.minPrice !== undefined) {
            products = products.filter(p => p.price >= filters.minPrice!);
        }

        if (filters?.maxPrice !== undefined) {
            products = products.filter(p => p.price <= filters.maxPrice!);
        }

        // Apply stock filter
        if (filters?.inStock !== undefined) {
            if (filters.inStock) {
                products = products.filter(p => p.isActive);
            }
        }

        // Apply sorting
        if (filters?.sortBy) {
            switch (filters.sortBy) {
                case 'price-asc':
                    products.sort((a, b) => a.price - b.price);
                    break;
                case 'price-desc':
                    products.sort((a, b) => b.price - a.price);
                    break;
                case 'name':
                    products.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'newest':
                    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    break;
                case 'popularity':
                    products.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
                    break;
                case 'rating':
                    products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                    break;
            }
        }

        // Apply limit
        const limitedProducts = products.slice(0, limit);

        return {
            products: limitedProducts,
            totalCount: products.length,
            hasNextPage: products.length > limit,
            suggestions: products.length === 0 ? ['mangalsutra', 'silver', 'gold'] : undefined,
            popularProducts: products.length === 0 ? mockProducts.slice(0, 2) : undefined,
        };
    }

    static async getProductById(id: string): Promise<Product | null> {
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockProducts.find(p => p.id === id) || null;
    }
}