// Mock product data for development and testing
export const mockProducts = [
  {
    id: '1',
    name: 'Traditional Gold-Plated Silver Mangalsutra',
    description: 'Elegant traditional design with intricate gold plating on pure silver. Perfect for weddings and special occasions.',
    price: 8500,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500&h=500&fit=crop&crop=center'
    ],
    category: 'traditional' as const,
    material: 'silver',
    weight: 25.5,
    length: 18,
    style: 'Traditional Pendant',
    occasion: ['Wedding', 'Festival', 'Religious'],
    metaTitle: 'Traditional Gold-Plated Silver Mangalsutra | Prayan Jewels',
    metaDescription: 'Beautiful traditional mangalsutra with gold plating on pure silver',
    keywords: ['traditional', 'gold-plated', 'wedding', 'mangalsutra'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableQuantity: 5
  },
  {
    id: '2',
    name: 'Modern Minimalist Silver Chain',
    description: 'Contemporary design with clean lines and modern aesthetics. Perfect for everyday wear.',
    price: 4200,
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=500&h=500&fit=crop&crop=center'
    ],
    category: 'modern' as const,
    material: 'silver',
    weight: 12.3,
    length: 16,
    style: 'Minimalist Chain',
    occasion: ['Daily Wear', 'Office', 'Casual'],
    metaTitle: 'Modern Minimalist Silver Mangalsutra | Prayan Jewels',
    metaDescription: 'Sleek modern mangalsutra design for contemporary women',
    keywords: ['modern', 'minimalist', 'daily wear', 'silver'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableQuantity: 12
  },
  {
    id: '3',
    name: 'Designer Diamond-Cut Silver Mangalsutra',
    description: 'Exclusive designer piece with diamond-cut patterns and premium finish. A statement piece for special occasions.',
    price: 15800,
    images: [
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=500&h=500&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=500&h=500&fit=crop&crop=center'
    ],
    category: 'designer' as const,
    material: 'silver',
    weight: 35.7,
    length: 20,
    style: 'Diamond-Cut Designer',
    occasion: ['Wedding', 'Anniversary', 'Special Events'],
    metaTitle: 'Designer Diamond-Cut Silver Mangalsutra | Prayan Jewels',
    metaDescription: 'Exclusive designer mangalsutra with diamond-cut patterns',
    keywords: ['designer', 'diamond-cut', 'premium', 'exclusive'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableQuantity: 3
  },
  {
    id: '4',
    name: 'Antique Silver Mangalsutra with Beads',
    description: 'Traditional antique design with black beads and oxidized silver finish. Timeless elegance.',
    price: 6750,
    images: [
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=500&h=500&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500&h=500&fit=crop&crop=center'
    ],
    category: 'traditional' as const,
    material: 'silver',
    weight: 28.9,
    length: 22,
    style: 'Antique with Beads',
    occasion: ['Wedding', 'Traditional Events', 'Festival'],
    metaTitle: 'Antique Silver Mangalsutra with Black Beads | Prayan Jewels',
    metaDescription: 'Beautiful antique mangalsutra with traditional black beads',
    keywords: ['antique', 'black beads', 'traditional', 'oxidized'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableQuantity: 8
  },
  {
    id: '5',
    name: 'Contemporary Layered Silver Chain',
    description: 'Modern layered design with multiple chain styles. Perfect for the fashion-forward bride.',
    price: 9200,
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=500&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=500&h=500&fit=crop&crop=center'
    ],
    category: 'modern' as const,
    material: 'silver',
    weight: 18.4,
    length: 18,
    style: 'Layered Contemporary',
    occasion: ['Wedding', 'Party', 'Fashion Events'],
    metaTitle: 'Contemporary Layered Silver Mangalsutra | Prayan Jewels',
    metaDescription: 'Trendy layered mangalsutra design for modern brides',
    keywords: ['contemporary', 'layered', 'modern', 'trendy'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableQuantity: 6
  },
  {
    id: '6',
    name: 'Luxury Designer Kundan Silver Mangalsutra',
    description: 'Premium designer piece with Kundan work and intricate craftsmanship. The epitome of luxury.',
    price: 22500,
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=500&h=500&fit=crop&crop=center'
    ],
    category: 'designer' as const,
    material: 'silver',
    weight: 42.1,
    length: 24,
    style: 'Luxury Kundan Designer',
    occasion: ['Wedding', 'Royal Events', 'Premium Occasions'],
    metaTitle: 'Luxury Designer Kundan Silver Mangalsutra | Prayan Jewels',
    metaDescription: 'Premium Kundan work designer mangalsutra for luxury occasions',
    keywords: ['luxury', 'kundan', 'designer', 'premium'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableQuantity: 2
  }
];

// Mock inventory data
export const mockInventory = mockProducts.map(product => ({
  id: `inv-${product.id}`,
  productId: product.id,
  stockQuantity: product.availableQuantity + 2, // Add some buffer
  reservedQuantity: 0,
  reorderPoint: 3,
  supplierName: 'Silver Craft Industries',
  supplierContact: '+91-9876543210',
  leadTime: 7,
  lastRestocked: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));