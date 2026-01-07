// Core TypeScript interfaces for Silver Mangalsutra Ecommerce Platform
// These interfaces align with the GraphQL schema and provide type safety

export interface Product {
  id: string;
  name: string;
  description: string; // Single comprehensive description with all details
  price: number;
  images: string[]; // Local image paths
  isActive: boolean | null;
  viewCount?: number | null; // Number of times viewed
  // New fields for enhanced search
  averageRating?: number | null; // 1-5 star rating
  totalReviews?: number | null; // Total number of reviews
  popularityScore?: number | null; // Calculated popularity score
  purchaseCount?: number | null; // Number of times purchased
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number; // computed: stock - reserved
  reorderPoint: number;
  supplierName?: string;
  supplierContact?: string;
  leadTime?: number; // in days
  lastRestocked?: string;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  type: 'shipping' | 'billing' | null;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingCart {
  id: string;
  customerId?: string; // null for guest carts
  sessionId?: string; // for guest cart persistence
  subtotal: number;
  estimatedTax: number;
  estimatedShipping: number;
  estimatedTotal: number;
  expiresAt?: string;
  items?: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  cart?: ShoppingCart;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  subtotal: number;
  tax: number | null;
  shipping: number | null;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | null;
  confirmationNumber?: string | null; // Unique order confirmation number
  paymentOrderId?: string | null; // Razorpay order ID
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  billingFirstName: string;
  billingLastName: string;
  billingAddressLine1: string;
  billingAddressLine2?: string | null;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
  customer?: any; // Will be replaced with Cognito user data
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  order?: Order;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

// Utility types for forms and API requests
export interface CreateProductInput {
  name: string;
  description: string; // Single comprehensive description
  price: number;
  images: string[]; // Local image paths
  isActive?: boolean;
  // Additional fields for inventory setup
  initialStock?: number;
  reorderPoint?: number;
  supplierName?: string;
  supplierContact?: string;
  leadTime?: number;
}

export interface UpdateProductInput extends Partial<Omit<CreateProductInput, 'initialStock' | 'reorderPoint' | 'supplierName' | 'supplierContact' | 'leadTime'>> {
  id?: string;
  viewCount?: number;
  purchaseCount?: number;
}

export interface CreateOrderInput {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  shippingAddress: Omit<Address, 'id' | 'userId' | 'type' | 'createdAt' | 'updatedAt'>;
  billingAddress: Omit<Address, 'id' | 'userId' | 'type' | 'createdAt' | 'updatedAt'>;
}

export interface CartOperations {
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCart: () => Promise<ShoppingCart | null>;
}

// Search and filter types
export interface ProductFilters {
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  searchQuery?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'name' | 'newest' | 'popularity' | 'rating' | 'most-relevant';
}

export interface ProductSearchResult {
  products: Product[];
  totalCount: number;
  hasNextPage: boolean;
  nextToken?: string; // For pagination
  suggestions?: string[]; // Alternative suggestions for no results
  popularProducts?: Product[]; // Popular products for no results
}

// Search history and saved searches
export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters?: ProductFilters;
  createdAt: string;
  updatedAt: string;
}

// Admin specific types
export interface AdminDashboardStats {
  totalOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  pendingOrders: number;
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  alertType: 'low_stock' | 'out_of_stock';
}

// Wishlist types
export interface WishlistItem {
  id: string;
  customerId: string;
  productId: string;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishlistItemInput {
  customerId: string;
  productId: string;
}

// Payment related types (for Razorpay integration)
export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}