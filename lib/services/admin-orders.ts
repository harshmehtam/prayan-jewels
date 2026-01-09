// Admin order management service
import { Order, OrderItem } from '@/types';
import { OrderService } from '@/lib/services/order-service';
import { EmailService } from '@/lib/services/email';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

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
  // Initialize SNS client for SMS
  private static getSNSClient() {
    return new SNSClient({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  // Send SMS using AWS SNS
  private static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Format phone number for international format
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;

      const snsClient = this.getSNSClient();
      const command = new PublishCommand({
        PhoneNumber: formattedPhone,
        Message: message,
      });

      const result = await snsClient.send(command);
      console.log('✅ SMS sent successfully:', result.MessageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      return false;
    }
  }

  // Send notifications when order is shipped
  private static async sendShippedNotifications(
    order: Order, 
    trackingNumber?: string, 
    estimatedDelivery?: string
  ): Promise<void> {
    try {
      // Send email notification if customer has email
      if (order.customerEmail) {
        try {
          const estimatedDeliveryDate = estimatedDelivery ? new Date(estimatedDelivery) : undefined;
          await EmailService.sendOrderShippingEmail(
            order.customerEmail,
            order.id,
            order.confirmationNumber || order.id,
            trackingNumber,
            estimatedDeliveryDate
          );
          console.log('✅ Shipped notification email sent to:', order.customerEmail);
        } catch (emailError) {
          console.error('❌ Failed to send shipped notification email:', emailError);
        }
      }

      // Send SMS notification if customer has phone number
      if (order.customerPhone) {
        try {
          let smsMessage = `Order Shipped! 📦 Your order #${order.confirmationNumber || order.id} is on its way.`;
          
          if (trackingNumber) {
            smsMessage += ` Tracking: ${trackingNumber}.`;
          }
          
          if (estimatedDelivery) {
            const deliveryDate = new Date(estimatedDelivery);
            smsMessage += ` Expected delivery: ${deliveryDate.toLocaleDateString('en-IN')}.`;
          }
          
          smsMessage += ' Thank you for shopping with us!';
          
          await this.sendSMS(order.customerPhone, smsMessage);
          console.log('✅ Shipped notification SMS sent to:', order.customerPhone);
        } catch (smsError) {
          console.error('❌ Failed to send shipped notification SMS:', smsError);
        }
      }
    } catch (error) {
      console.error('❌ Error sending shipped notifications:', error);
      // Don't throw error for notification failures
    }
  }
  // Get all orders with filtering and pagination
  static async getOrders(
    filters: OrderFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<{ orders: Order[]; totalCount: number; errors?: any }> {
    try {
      // Get all orders from the database
      const allOrdersResponse = await OrderService.getAllOrders();
      
      if (allOrdersResponse.errors) {
        return {
          orders: [],
          totalCount: 0,
          errors: allOrdersResponse.errors
        };
      }

      let filteredOrders = allOrdersResponse.orders;

      // Apply filters
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
          `${order.shippingFirstName} ${order.shippingLastName}`.toLowerCase().includes(query)
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
      const result = await OrderService.getOrder(orderId);
      return result as { order: Order | null; errors?: any };
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
      if (updateData.status) {
        const result = await OrderService.updateOrderStatus(orderId, updateData.status);
        
        // If updating to shipped status, send notifications
        if (updateData.status === 'shipped' && result.order) {
          // Cast the order to our Order type for notification purposes
          const orderForNotification = result.order as any as Order;
          await this.sendShippedNotifications(orderForNotification, updateData.trackingNumber, updateData.estimatedDelivery);
        }
        
        // If updating to shipped status and tracking number provided
        if (updateData.status === 'shipped' && updateData.trackingNumber) {
          await OrderService.addTrackingInfo(orderId, updateData.trackingNumber, updateData.estimatedDelivery);
        }
        
        return result as { order: Order | null; errors?: any };
      }

      // For other updates, get the current order
      const result = await OrderService.getOrder(orderId);
      return result as { order: Order | null; errors?: any };
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
      const allOrdersResponse = await OrderService.getAllOrders();
      
      if (allOrdersResponse.errors) {
        return {
          analytics: this.getEmptyAnalytics(),
          errors: allOrdersResponse.errors
        };
      }

      let filteredOrders = allOrdersResponse.orders;
      
      // Filter by date range if provided
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
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
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

      // For top products, we'd need to fetch order items
      // For now, return empty array as this requires additional queries
      const topProducts: OrderAnalytics['topProducts'] = [];

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
        analytics: this.getEmptyAnalytics(),
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

  // Helper method to get empty analytics
  private static getEmptyAnalytics(): OrderAnalytics {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      ordersByStatus: { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
      recentOrders: [],
      topProducts: [],
      salesByMonth: []
    };
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
        existing.revenue += order.totalAmount || 0;
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