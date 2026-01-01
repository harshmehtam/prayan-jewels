// Admin order management service
import { Order, OrderItem } from '@/types';
import { MockOrderService } from '@/lib/data/mock-orders';

export interface OrderFilters {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  recentOrders: Order[];
  topProducts: {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
  salesByMonth: {
    month: string;
    revenue: number;
    orderCount: number;
  }[];
}

export interface OrderUpdateData {
  status?: Order['status'];
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
}

export class AdminOrderService {
  // Get all orders with filtering and pagination
  static async getOrders(
    filters: OrderFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ orders: Order[]; totalCount: number; errors?: any }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get all mock orders (in real app, this would be a database query)
      const allOrders = await this.getAllMockOrders();
      
      // Apply filters
      let filteredOrders = allOrders;

      if (filters.status) {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }

      if (filters.customerId) {
        filteredOrders = filteredOrders.filter(order => order.customerId === filters.customerId);
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.id.toLowerCase().includes(query) ||
          order.confirmationNumber?.toLowerCase().includes(query) ||
          order.paymentOrderId?.toLowerCase().includes(query) ||
          order.trackingNumber?.toLowerCase().includes(query) ||
          `${order.shippingFirstName} ${order.shippingLastName}`.toLowerCase().includes(query) ||
          order.items?.some(item => item.productName.toLowerCase().includes(query))
        );
      }

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) >= fromDate
        );
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) <= toDate
        );
      }

      if (filters.minAmount) {
        filteredOrders = filteredOrders.filter(order => order.totalAmount >= filters.minAmount!);
      }

      if (filters.maxAmount) {
        filteredOrders = filteredOrders.filter(order => order.totalAmount <= filters.maxAmount!);
      }

      // Sort by creation date (newest first)
      filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination
      const totalCount = filteredOrders.length;
      const paginatedOrders = filteredOrders.slice(offset, offset + limit);

      return {
        orders: paginatedOrders,
        totalCount
      };
    } catch (error) {
      console.error('Error getting orders:', error);
      return {
        orders: [],
        totalCount: 0,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to get orders' }]
      };
    }
  }

  // Get a specific order by ID with full details
  static async getOrderById(orderId: string): Promise<{ order: Order | null; errors?: any }> {
    try {
      const result = await MockOrderService.getOrder(orderId);
      return result;
    } catch (error) {
      console.error('Error getting order:', error);
      return {
        order: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to get order' }]
      };
    }
  }

  // Update order details
  static async updateOrder(
    orderId: string, 
    updateData: OrderUpdateData
  ): Promise<{ order: Order | null; errors?: any }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      if (updateData.status) {
        const result = await MockOrderService.updateOrderStatus(orderId, updateData.status);
        if (result.order && updateData.trackingNumber) {
          // In a real app, this would update the tracking number in the database
          result.order.trackingNumber = updateData.trackingNumber;
        }
        if (result.order && updateData.estimatedDelivery) {
          result.order.estimatedDelivery = updateData.estimatedDelivery;
        }
        return result;
      }

      // For other updates, we'd implement similar logic
      const result = await MockOrderService.getOrder(orderId);
      return result;
    } catch (error) {
      console.error('Error updating order:', error);
      return {
        order: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to update order' }]
      };
    }
  }

  // Get order analytics and reports
  static async getOrderAnalytics(
    dateFrom?: string,
    dateTo?: string
  ): Promise<{ analytics: OrderAnalytics; errors?: any }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const allOrders = await this.getAllMockOrders();
      
      // Filter by date range if provided
      let filteredOrders = allOrders;
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) >= fromDate
        );
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredOrders = filteredOrders.filter(order => 
          new Date(order.createdAt) <= toDate
        );
      }

      // Calculate analytics
      const totalOrders = filteredOrders.length;
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Orders by status
      const ordersByStatus = {
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        processing: filteredOrders.filter(o => o.status === 'processing').length,
        shipped: filteredOrders.filter(o => o.status === 'shipped').length,
        delivered: filteredOrders.filter(o => o.status === 'delivered').length,
        cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
      };

      // Recent orders (last 10)
      const recentOrders = filteredOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      // Top products
      const productStats = new Map<string, { name: string; quantity: number; revenue: number }>();
      
      filteredOrders.forEach(order => {
        order.items?.forEach(item => {
          const existing = productStats.get(item.productId) || { 
            name: item.productName, 
            quantity: 0, 
            revenue: 0 
          };
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice;
          productStats.set(item.productId, existing);
        });
      });

      const topProducts = Array.from(productStats.entries())
        .map(([productId, stats]) => ({
          productId,
          productName: stats.name,
          totalQuantity: stats.quantity,
          totalRevenue: stats.revenue
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      // Sales by month (last 12 months)
      const salesByMonth = this.calculateSalesByMonth(filteredOrders);

      const analytics: OrderAnalytics = {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        recentOrders,
        topProducts,
        salesByMonth
      };

      return { analytics };
    } catch (error) {
      console.error('Error getting order analytics:', error);
      return {
        analytics: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          ordersByStatus: { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
          recentOrders: [],
          topProducts: [],
          salesByMonth: []
        },
        errors: [{ message: error instanceof Error ? error.message : 'Failed to get analytics' }]
      };
    }
  }

  // Bulk update orders
  static async bulkUpdateOrders(
    orderIds: string[],
    updateData: OrderUpdateData
  ): Promise<{ updatedOrders: Order[]; errors?: any }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));

      const updatedOrders: Order[] = [];
      
      for (const orderId of orderIds) {
        const result = await this.updateOrder(orderId, updateData);
        if (result.order) {
          updatedOrders.push(result.order);
        }
      }

      return { updatedOrders };
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      return {
        updatedOrders: [],
        errors: [{ message: error instanceof Error ? error.message : 'Failed to bulk update orders' }]
      };
    }
  }

  // Helper method to get all mock orders with items
  private static async getAllMockOrders(): Promise<Order[]> {
    // In a real app, this would be a database query
    // For now, we'll create some additional mock data
    const mockOrders: Order[] = [
      {
        id: 'order-1',
        customerId: 'user-1',
        subtotal: 2500,
        tax: 450,
        shipping: 0,
        totalAmount: 2950,
        status: 'delivered',
        confirmationNumber: 'CONF-001',
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
        items: [
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
          }
        ]
      },
      {
        id: 'order-2',
        customerId: 'user-2',
        subtotal: 1800,
        tax: 324,
        shipping: 100,
        totalAmount: 2224,
        status: 'shipped',
        confirmationNumber: 'CONF-002',
        paymentOrderId: 'razorpay_order_2',
        trackingNumber: 'TRK987654321',
        estimatedDelivery: '2024-01-25',
        shippingFirstName: 'Jane',
        shippingLastName: 'Smith',
        shippingAddressLine1: '456 Oak Avenue',
        shippingCity: 'Delhi',
        shippingState: 'Delhi',
        shippingPostalCode: '110001',
        shippingCountry: 'India',
        billingFirstName: 'Jane',
        billingLastName: 'Smith',
        billingAddressLine1: '456 Oak Avenue',
        billingCity: 'Delhi',
        billingState: 'Delhi',
        billingPostalCode: '110001',
        billingCountry: 'India',
        createdAt: '2024-01-20T15:45:00Z',
        updatedAt: '2024-01-22T09:15:00Z',
        items: [
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
          }
        ]
      },
      {
        id: 'order-3',
        customerId: 'user-3',
        subtotal: 3200,
        tax: 576,
        shipping: 0,
        totalAmount: 3776,
        status: 'processing',
        confirmationNumber: 'CONF-003',
        paymentOrderId: 'razorpay_order_3',
        shippingFirstName: 'Priya',
        shippingLastName: 'Patel',
        shippingAddressLine1: '789 Garden Road',
        shippingCity: 'Bangalore',
        shippingState: 'Karnataka',
        shippingPostalCode: '560001',
        shippingCountry: 'India',
        billingFirstName: 'Priya',
        billingLastName: 'Patel',
        billingAddressLine1: '789 Garden Road',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingPostalCode: '560001',
        billingCountry: 'India',
        createdAt: '2024-01-28T11:20:00Z',
        updatedAt: '2024-01-28T11:20:00Z',
        items: [
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
        ]
      },
      {
        id: 'order-4',
        customerId: 'user-4',
        subtotal: 4500,
        tax: 810,
        shipping: 150,
        totalAmount: 5460,
        status: 'pending',
        confirmationNumber: 'CONF-004',
        paymentOrderId: 'razorpay_order_4',
        shippingFirstName: 'Anita',
        shippingLastName: 'Sharma',
        shippingAddressLine1: '321 Temple Street',
        shippingCity: 'Jaipur',
        shippingState: 'Rajasthan',
        shippingPostalCode: '302001',
        shippingCountry: 'India',
        billingFirstName: 'Anita',
        billingLastName: 'Sharma',
        billingAddressLine1: '321 Temple Street',
        billingCity: 'Jaipur',
        billingState: 'Rajasthan',
        billingPostalCode: '302001',
        billingCountry: 'India',
        createdAt: '2024-01-30T09:15:00Z',
        updatedAt: '2024-01-30T09:15:00Z',
        items: [
          {
            id: 'item-4',
            orderId: 'order-4',
            productId: 'product-4',
            productName: 'Antique Style Silver Mangalsutra Set',
            quantity: 1,
            unitPrice: 4500,
            totalPrice: 4500,
            createdAt: '2024-01-30T09:15:00Z',
            updatedAt: '2024-01-30T09:15:00Z',
          }
        ]
      },
      {
        id: 'order-5',
        customerId: 'user-5',
        subtotal: 2200,
        tax: 396,
        shipping: 0,
        totalAmount: 2596,
        status: 'cancelled',
        confirmationNumber: 'CONF-005',
        paymentOrderId: 'razorpay_order_5',
        shippingFirstName: 'Meera',
        shippingLastName: 'Gupta',
        shippingAddressLine1: '654 Lake View',
        shippingCity: 'Chennai',
        shippingState: 'Tamil Nadu',
        shippingPostalCode: '600001',
        shippingCountry: 'India',
        billingFirstName: 'Meera',
        billingLastName: 'Gupta',
        billingAddressLine1: '654 Lake View',
        billingCity: 'Chennai',
        billingState: 'Tamil Nadu',
        billingPostalCode: '600001',
        billingCountry: 'India',
        createdAt: '2024-01-25T14:30:00Z',
        updatedAt: '2024-01-26T10:45:00Z',
        items: [
          {
            id: 'item-5',
            orderId: 'order-5',
            productId: 'product-5',
            productName: 'Contemporary Silver Mangalsutra Chain',
            quantity: 1,
            unitPrice: 2200,
            totalPrice: 2200,
            createdAt: '2024-01-25T14:30:00Z',
            updatedAt: '2024-01-25T14:30:00Z',
          }
        ]
      }
    ];

    return mockOrders;
  }

  // Helper method to calculate sales by month
  private static calculateSalesByMonth(orders: Order[]): OrderAnalytics['salesByMonth'] {
    const monthlyData = new Map<string, { revenue: number; orderCount: number }>();
    
    // Initialize last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      monthlyData.set(monthKey, { revenue: 0, orderCount: 0 });
    }

    // Aggregate order data by month
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthKey = orderDate.toISOString().substring(0, 7);
      
      const existing = monthlyData.get(monthKey);
      if (existing) {
        existing.revenue += order.totalAmount;
        existing.orderCount += 1;
      }
    });

    // Convert to array format
    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orderCount: data.orderCount
    }));
  }
}