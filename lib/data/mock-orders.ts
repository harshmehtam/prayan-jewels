// Mock order data and service
import type { Order, OrderItem } from '@/types';

// Mock orders data
const mockOrders: Order[] = [
  {
    id: 'order-1',
    customerId: 'user-1',
    subtotal: 2500,
    tax: 450,
    shipping: 0,
    totalAmount: 2950,
    status: 'delivered',
    paymentOrderId: 'razorpay_order_1',
    trackingNumber: 'TRK123456789',
    estimatedDelivery: '2024-01-15',
    shippingFirstName: 'John',
    shippingLastName: 'Doe',
    shippingAddressLine1: '123 Main Street',
    shippingAddressLine2: 'Apt 4B',
    shippingCity: 'Mumbai',
    shippingState: 'Maharashtra',
    shippingPostalCode: '400001',
    shippingCountry: 'India',
    billingFirstName: 'John',
    billingLastName: 'Doe',
    billingAddressLine1: '123 Main Street',
    billingAddressLine2: 'Apt 4B',
    billingCity: 'Mumbai',
    billingState: 'Maharashtra',
    billingPostalCode: '400001',
    billingCountry: 'India',
    createdAt: '2024-01-10T10:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
  },
  {
    id: 'order-2',
    customerId: 'user-1',
    subtotal: 1800,
    tax: 324,
    shipping: 100,
    totalAmount: 2224,
    status: 'shipped',
    paymentOrderId: 'razorpay_order_2',
    trackingNumber: 'TRK987654321',
    estimatedDelivery: '2024-01-25',
    shippingFirstName: 'John',
    shippingLastName: 'Doe',
    shippingAddressLine1: '123 Main Street',
    shippingAddressLine2: 'Apt 4B',
    shippingCity: 'Mumbai',
    shippingState: 'Maharashtra',
    shippingPostalCode: '400001',
    shippingCountry: 'India',
    billingFirstName: 'John',
    billingLastName: 'Doe',
    billingAddressLine1: '123 Main Street',
    billingAddressLine2: 'Apt 4B',
    billingCity: 'Mumbai',
    billingState: 'Maharashtra',
    billingPostalCode: '400001',
    billingCountry: 'India',
    createdAt: '2024-01-20T15:45:00Z',
    updatedAt: '2024-01-22T09:15:00Z',
  },
  {
    id: 'order-3',
    customerId: 'user-1',
    subtotal: 3200,
    tax: 576,
    shipping: 0,
    totalAmount: 3776,
    status: 'processing',
    paymentOrderId: 'razorpay_order_3',
    shippingFirstName: 'John',
    shippingLastName: 'Doe',
    shippingAddressLine1: '123 Main Street',
    shippingAddressLine2: 'Apt 4B',
    shippingCity: 'Mumbai',
    shippingState: 'Maharashtra',
    shippingPostalCode: '400001',
    shippingCountry: 'India',
    billingFirstName: 'John',
    billingLastName: 'Doe',
    billingAddressLine1: '123 Main Street',
    billingAddressLine2: 'Apt 4B',
    billingCity: 'Mumbai',
    billingState: 'Maharashtra',
    billingPostalCode: '400001',
    billingCountry: 'India',
    createdAt: '2024-01-28T11:20:00Z',
    updatedAt: '2024-01-28T11:20:00Z',
  }
];

// Mock order items
const mockOrderItems: OrderItem[] = [
  {
    id: 'item-1',
    orderId: 'order-1',
    productId: 'product-1',
    productName: 'Traditional Gold-Plated Silver Mangalsutra',
    quantity: 1,
    unitPrice: 2500,
    totalPrice: 2500,
    createdAt: '2024-01-10T10:30:00Z',
    updatedAt: '2024-01-10T10:30:00Z',
  },
  {
    id: 'item-2',
    orderId: 'order-2',
    productId: 'product-2',
    productName: 'Modern Minimalist Silver Mangalsutra',
    quantity: 1,
    unitPrice: 1800,
    totalPrice: 1800,
    createdAt: '2024-01-20T15:45:00Z',
    updatedAt: '2024-01-20T15:45:00Z',
  },
  {
    id: 'item-3',
    orderId: 'order-3',
    productId: 'product-3',
    productName: 'Designer Diamond-Cut Silver Mangalsutra',
    quantity: 1,
    unitPrice: 3200,
    totalPrice: 3200,
    createdAt: '2024-01-28T11:20:00Z',
    updatedAt: '2024-01-28T11:20:00Z',
  }
];

export class MockOrderService {
  // Get orders for a specific user
  static async getUserOrders(userId: string): Promise<{ orders: Order[]; errors?: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const userOrders = mockOrders.filter(order => order.customerId === userId);
    
    // Add order items to each order
    const ordersWithItems = userOrders.map(order => ({
      ...order,
      items: mockOrderItems.filter(item => item.orderId === order.id)
    }));

    return {
      orders: ordersWithItems,
    };
  }

  // Get a specific order by ID
  static async getOrder(orderId: string): Promise<{ order: Order | null; errors?: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const order = mockOrders.find(o => o.id === orderId);
    
    if (order) {
      const orderWithItems = {
        ...order,
        items: mockOrderItems.filter(item => item.orderId === order.id)
      };
      
      return { order: orderWithItems };
    }

    return { order: null };
  }

  // Get recent orders for a user (last 3)
  static async getRecentOrders(userId: string): Promise<{ orders: Order[]; errors?: any }> {
    const userOrdersResponse = await this.getUserOrders(userId);
    
    // Sort by creation date and take the last 3
    const recentOrders = userOrdersResponse.orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    return {
      orders: recentOrders,
    };
  }

  // Create a new order (for checkout)
  static async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ order: Order; errors?: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to mock data (in real app, this would be saved to backend)
    mockOrders.push(newOrder);

    return { order: newOrder };
  }

  // Update order status
  static async updateOrderStatus(orderId: string, status: Order['status']): Promise<{ order: Order | null; errors?: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
      mockOrders[orderIndex] = {
        ...mockOrders[orderIndex],
        status,
        updatedAt: new Date().toISOString(),
      };

      const updatedOrder = {
        ...mockOrders[orderIndex],
        items: mockOrderItems.filter(item => item.orderId === orderId)
      };

      return { order: updatedOrder };
    }

    return { order: null };
  }

  // Cancel an order
  static async cancelOrder(orderId: string): Promise<{ success: boolean; errors?: any }> {
    const result = await this.updateOrderStatus(orderId, 'cancelled');
    return { success: !!result.order };
  }
}