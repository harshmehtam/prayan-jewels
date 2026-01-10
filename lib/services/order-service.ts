import { getClient, getServerClient } from '@/lib/amplify-client';
import type { CartItem, Address } from '@/types';
import { EmailService } from './email';
import { CouponService } from './coupon-service';
import { AdminCouponService } from './admin-coupons';

export interface CreateOrderData {
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  shippingAddress: Partial<Address>;
  billingAddress: Partial<Address>;
  paymentMethod: 'razorpay' | 'cash_on_delivery';
  subtotal: number;
  tax: number;
  shipping: number;
  couponId?: string;
  couponCode?: string;
  couponDiscount?: number;
  totalAmount: number;
  paymentOrderId?: string;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  confirmationNumber?: string;
  error?: string;
}

// AWS SNS SMS Service
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export class OrderService {
  // Generate unique guest customer ID based on email and phone
  static generateGuestCustomerId(email: string, phone: string): string {
    // Create a consistent hash-based ID for guest users
    // This allows the same guest to be identified across orders
    const identifier = `${email.toLowerCase()}_${phone.replace(/\D/g, '')}`;
    const hash = btoa(identifier).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    return `guest_${hash}`;
  }

  // Generate unique confirmation number
  static generateConfirmationNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  // Get SNS client with proper credentials
  private static getSNSClient(): SNSClient | null {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('⚠️ AWS credentials not configured for SMS service');
      return null;
    }

    return new SNSClient({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  // Send SMS using AWS SNS
  private static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const snsClient = this.getSNSClient();
      if (!snsClient) {
        console.log('📱 SMS service not configured - skipping SMS notification');
        return false;
      }

      // Format phone number for international format
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;

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

  // Create a new order
  static async createOrder(orderData: CreateOrderData): Promise<OrderResult> {
    try {
      console.log('🏪 OrderService: Creating order...');
      
      const client = getServerClient(); // Use server client for API routes
      const confirmationNumber = this.generateConfirmationNumber();
      
      // Create the order
      const orderResult = await client.models.Order.create({
        customerId: orderData.customerId,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        couponId: orderData.couponId,
        couponCode: orderData.couponCode,
        couponDiscount: orderData.couponDiscount || 0,
        totalAmount: orderData.totalAmount,
        status: 'pending',
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
        confirmationNumber,
        paymentOrderId: orderData.paymentOrderId,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        
        // Shipping address
        shippingFirstName: orderData.shippingAddress.firstName || '',
        shippingLastName: orderData.shippingAddress.lastName || '',
        shippingAddressLine1: orderData.shippingAddress.addressLine1 || '',
        shippingAddressLine2: orderData.shippingAddress.addressLine2 || '',
        shippingCity: orderData.shippingAddress.city || '',
        shippingState: orderData.shippingAddress.state || '',
        shippingPostalCode: orderData.shippingAddress.postalCode || '',
        shippingCountry: orderData.shippingAddress.country || '',
        
        // Billing address
        billingFirstName: orderData.billingAddress.firstName || '',
        billingLastName: orderData.billingAddress.lastName || '',
        billingAddressLine1: orderData.billingAddress.addressLine1 || '',
        billingAddressLine2: orderData.billingAddress.addressLine2 || '',
        billingCity: orderData.billingAddress.city || '',
        billingState: orderData.billingAddress.state || '',
        billingPostalCode: orderData.billingAddress.postalCode || '',
        billingCountry: orderData.billingAddress.country || '',
      });

      if (!orderResult.data) {
        console.error('🏪 OrderService: Order creation failed - no data returned');
        if (orderResult.errors) {
          console.error('🏪 OrderService: Errors:', orderResult.errors);
        }
        throw new Error('Failed to create order');
      }

      const orderId = orderResult.data.id;

      // Batch fetch all products first to avoid multiple API calls
      const productIds = [...new Set(orderData.items.map(item => item.productId))];
      const productsResult = await client.models.Product.list({
        filter: {
          or: productIds.map(id => ({ id: { eq: id } }))
        }
      });

      // Create a map for quick product lookup
      const productMap = new Map();
      if (productsResult.data) {
        productsResult.data.forEach(product => {
          productMap.set(product.id, product);
        });
      }

      // Create order items with batched product data
      const orderItemPromises = orderData.items.map(async (item) => {
        const product = productMap.get(item.productId);
        const productName = product?.name || `Product ${item.productId}`;

        return client.models.OrderItem.create({
          orderId,
          productId: item.productId,
          productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
      });

      await Promise.all(orderItemPromises);

      // Handle coupon usage tracking
      if (orderData.couponId && orderData.customerId && !orderData.customerId.startsWith('guest_')) {
        try {
          // Record user coupon usage
          await CouponService.recordCouponUsage(orderData.customerId, orderData.couponId);
          
          // Increment global coupon usage count
          await AdminCouponService.incrementCouponUsage(orderData.couponId);
          
          console.log('✅ Coupon usage recorded:', { couponId: orderData.couponId, userId: orderData.customerId });
        } catch (couponError) {
          console.error('❌ Error recording coupon usage:', couponError);
          // Don't fail the order for coupon tracking errors
        }
      }

      // Send notifications
      await this.sendOrderNotifications(orderData, confirmationNumber, orderId, orderItemPromises);

      console.log('✅ OrderService: Order created successfully:', { orderId, confirmationNumber });

      return {
        success: true,
        orderId,
        confirmationNumber,
      };
    } catch (error) {
      console.error('❌ OrderService: Error creating order:', error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('❌ OrderService: Error name:', error.name);
        console.error('❌ OrderService: Error message:', error.message);
        console.error('❌ OrderService: Error stack:', error.stack);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Send order notifications (email and SMS using AWS services)
  private static async sendOrderNotifications(orderData: CreateOrderData, confirmationNumber: string, orderId: string, orderItemPromises: Promise<any>[]): Promise<void> {
    // Don't let notification failures block order creation
    try {
      // Send email notification using AWS SES
      try {
        // Wait for order items to be created and get the actual product names
        const createdOrderItems = await Promise.all(orderItemPromises);
        const orderItemsWithNames = createdOrderItems.map(result => result.data).filter(Boolean);

        await EmailService.sendOrderConfirmationEmail({
          orderId,
          confirmationNumber,
          customerEmail: orderData.customerEmail,
          orderDetails: {
            items: orderItemsWithNames,
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            shipping: orderData.shipping,
            couponCode: orderData.couponCode,
            couponDiscount: orderData.couponDiscount || 0,
            totalAmount: orderData.totalAmount,
            shippingAddress: {
              firstName: orderData.shippingAddress.firstName || '',
              lastName: orderData.shippingAddress.lastName || '',
              addressLine1: orderData.shippingAddress.addressLine1 || '',
              addressLine2: orderData.shippingAddress.addressLine2 || '',
              city: orderData.shippingAddress.city || '',
              state: orderData.shippingAddress.state || '',
              postalCode: orderData.shippingAddress.postalCode || '',
              country: orderData.shippingAddress.country || '',
            },
          },
        });
        console.log('✅ Order confirmation email sent via AWS SES');
      } catch (emailError) {
        console.error('❌ Failed to send email via AWS SES:', emailError);
        console.log('ℹ️ Order created successfully without email notification');
      }

      // Send SMS notification using AWS SNS
      if (orderData.customerPhone) {
        try {
          let smsMessage = `Order Confirmed! Order #${confirmationNumber}. Amount: ₹${orderData.totalAmount.toLocaleString()}`;
          
          if (orderData.couponCode && orderData.couponDiscount && orderData.couponDiscount > 0) {
            smsMessage += ` (Saved ₹${orderData.couponDiscount.toLocaleString()} with ${orderData.couponCode})`;
          }
          
          smsMessage += `. Payment: ${orderData.paymentMethod === 'cash_on_delivery' ? 'COD' : 'Paid Online'}. Thank you for your order!`;
          
          await this.sendSMS(orderData.customerPhone, smsMessage);
          console.log('✅ Order confirmation SMS sent via AWS SNS');
        } catch (smsError) {
          console.error('❌ Failed to send SMS via AWS SNS:', smsError);
          console.log('ℹ️ Order created successfully without SMS notification');
        }
      }
    } catch (error) {
      console.error('❌ Error in notification process:', error);
      console.log('ℹ️ Order created successfully without notifications');
      // Don't throw error for notification failures
    }
  }

  // Update order payment status
  static async updatePaymentStatus(
    orderId: string,
    paymentStatus: 'paid' | 'failed' | 'refunded',
    paymentId?: string
  ): Promise<boolean> {
    try {
      const client = getServerClient(); // Use server client for API operations
      const updateData: any = {
        id: orderId,
        paymentStatus,
      };

      if (paymentId) {
        updateData.paymentId = paymentId;
      }

      // If payment is successful, update order status to processing
      if (paymentStatus === 'paid') {
        updateData.status = 'processing';
      }

      const result = await client.models.Order.update(updateData);

      if (result.errors && result.errors.length > 0) {
        console.error('Error updating payment status:', result.errors);
        return false;
      }

      // Send payment success notifications - no SMS for payment confirmation
      if (paymentStatus === 'paid') {
        try {
          const order = await this.getOrderById(orderId);
          // Only log payment success, no SMS notification
          console.log('✅ Payment confirmed for order:', order?.confirmationNumber || orderId);
        } catch (notificationError) {
          console.error('❌ Failed to process payment success:', notificationError);
        }
      }

      // Send refund notification SMS
      if (paymentStatus === 'refunded') {
        try {
          const order = await this.getOrderById(orderId);
          if (order && order.customerPhone) {
            const smsMessage = `Refund Processed! 💰 Your refund for order #${order.confirmationNumber || orderId} of ₹${order.totalAmount.toLocaleString()} has been processed. It will reflect in your account within 5-7 business days.`;
            await this.sendSMS(order.customerPhone, smsMessage);
            console.log('✅ Refund SMS notification sent for order:', order.confirmationNumber || orderId);
          }
        } catch (notificationError) {
          console.error('❌ Failed to send refund notification:', notificationError);
        }
      }

      console.log('✅ Payment status updated:', { orderId, paymentStatus });
      return true;
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      return false;
    }
  }

  // Update order with payment information (for Razorpay integration)
  static async updateOrderPayment(orderId: string, paymentOrderId: string): Promise<boolean> {
    try {
      const client = getServerClient(); // Use server client for API operations
      const result = await client.models.Order.update({
        id: orderId,
        paymentOrderId,
      });

      if (result.errors && result.errors.length > 0) {
        console.error('Error updating order payment:', result.errors);
        return false;
      }

      console.log('✅ Order payment info updated:', { orderId, paymentOrderId });
      return true;
    } catch (error) {
      console.error('❌ Error updating order payment:', error);
      return false;
    }
  }

  // Get order by ID
  static async getOrderById(orderId: string) {
    try {
      const client = getServerClient(); // Use server client for API operations
      const result = await client.models.Order.get({ id: orderId });
      return result.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  // Get order by confirmation number
  static async getOrderByConfirmationNumber(confirmationNumber: string) {
    try {
      const client = await getClient();
      const result = await client.models.Order.list({
        filter: { confirmationNumber: { eq: confirmationNumber } }
      });
      return result.data?.[0] || null;
    } catch (error) {
      console.error('Error fetching order by confirmation number:', error);
      return null;
    }
  }

  // Get orders for a customer
  static async getCustomerOrders(customerId: string) {
    try {
      const client = await getClient();
      const result = await client.models.Order.list({
        filter: { customerId: { eq: customerId } }
      });
      
      if (result.errors && result.errors.length > 0) {
        console.error('Error fetching customer orders:', result.errors);
        return [];
      }

      const orders = result.data || [];
      
      if (orders.length === 0) {
        return [];
      }

      // Get ALL order items in a single call, then filter by customer's order IDs
      const orderIds = orders.map(order => order.id);
      const allItemsResult = await client.models.OrderItem.list();
      
      if (allItemsResult.errors && allItemsResult.errors.length > 0) {
        console.error('Error fetching order items:', allItemsResult.errors);
        // Return orders without items rather than failing completely
        return orders.map(order => ({ ...order, items: [] }));
      }

      // Filter items to only include those belonging to this customer's orders
      const customerOrderItems = (allItemsResult.data || []).filter(item => 
        orderIds.includes(item.orderId)
      );

      // Group items by orderId for efficient lookup
      const itemsByOrderId = new Map<string, any[]>();
      customerOrderItems.forEach(item => {
        if (!itemsByOrderId.has(item.orderId)) {
          itemsByOrderId.set(item.orderId, []);
        }
        itemsByOrderId.get(item.orderId)!.push(item);
      });

      // Attach items to orders
      const ordersWithItems = orders.map(order => ({
        ...order,
        items: itemsByOrderId.get(order.id) || []
      }));

      return ordersWithItems;
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }
  }

  // Get all orders (admin only)
  static async getAllOrders() {
    try {
      const client = await getClient();
      const result = await client.models.Order.list();
      
      if (result.errors && result.errors.length > 0) {
        return {
          orders: [],
          errors: result.errors
        };
      }

      const orders = result.data || [];
      
      if (orders.length === 0) {
        return {
          orders: [],
          errors: null
        };
      }

      // Get all order items in a single batch call instead of individual calls
      const allItemsResult = await client.models.OrderItem.list();
      
      if (allItemsResult.errors && allItemsResult.errors.length > 0) {
        console.error('Error fetching order items:', allItemsResult.errors);
        // Return orders without items rather than failing completely
        return {
          orders: orders.map(order => ({ ...order, items: [] })),
          errors: null
        };
      }

      // Group items by orderId for efficient lookup
      const itemsByOrderId = new Map<string, any[]>();
      (allItemsResult.data || []).forEach(item => {
        if (!itemsByOrderId.has(item.orderId)) {
          itemsByOrderId.set(item.orderId, []);
        }
        itemsByOrderId.get(item.orderId)!.push(item);
      });

      // Attach items to orders
      const ordersWithItems = orders.map(order => ({
        ...order,
        items: itemsByOrderId.get(order.id) || []
      }));

      return {
        orders: ordersWithItems,
        errors: null
      };
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return {
        orders: [],
        errors: [{ message: error instanceof Error ? error.message : 'Failed to fetch orders' }]
      };
    }
  }

  // Update order status (admin only)
  static async updateOrderStatus(orderId: string, status: string) {
    try {
      const client = await getClient();
      const result = await client.models.Order.update({
        id: orderId,
        status: status as any
      });

      if (result.errors && result.errors.length > 0) {
        return {
          order: null,
          errors: result.errors
        };
      }

      // Send status update notifications - SMS only for important statuses
      if (result.data) {
        try {
          const order = result.data;
          if (order.customerPhone) {
            let smsMessage = '';
            switch (status) {
              case 'shipped':
                smsMessage = `Order Shipped! 📦 Your order #${order.confirmationNumber || orderId} is on its way. Track your package for updates.`;
                break;
              case 'delivered':
                smsMessage = `Order Delivered! ✅ Your order #${order.confirmationNumber || orderId} has been delivered. Thank you for shopping with us!`;
                break;
              case 'cancelled':
                smsMessage = `Order Cancelled: Your order #${order.confirmationNumber || orderId} has been cancelled. Refund will be processed within 5-7 business days.`;
                break;
              // No SMS for 'processing', 'pending', or other statuses
              default:
                // No SMS notification for this status
                break;
            }
            
            if (smsMessage) {
              await this.sendSMS(order.customerPhone, smsMessage);
              console.log('✅ SMS notification sent for status:', status);
            } else {
              console.log('ℹ️ No SMS notification sent for status:', status);
            }
          }
        } catch (notificationError) {
          console.error('❌ Failed to send status update notifications:', notificationError);
        }
      }

      return {
        order: result.data,
        errors: null
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        order: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to update order status' }]
      };
    }
  }

  // Add tracking information (admin only)
  static async addTrackingInfo(orderId: string, trackingNumber: string, estimatedDelivery?: string) {
    try {
      const client = await getClient();
      const updateData: any = {
        id: orderId,
        trackingNumber
      };

      if (estimatedDelivery) {
        updateData.estimatedDelivery = estimatedDelivery;
      }

      const result = await client.models.Order.update(updateData);

      if (result.errors && result.errors.length > 0) {
        return {
          order: null,
          errors: result.errors
        };
      }

      // Send tracking notification - no SMS, only log
      if (result.data && result.data.customerPhone) {
        try {
          console.log('✅ Tracking info updated for order:', result.data.confirmationNumber || orderId);
          console.log('📦 Tracking number:', trackingNumber);
          if (estimatedDelivery) {
            console.log('📅 Estimated delivery:', new Date(estimatedDelivery).toLocaleDateString('en-IN'));
          }
        } catch (notificationError) {
          console.error('❌ Failed to log tracking info:', notificationError);
        }
      }

      return {
        order: result.data,
        errors: null
      };
    } catch (error) {
      console.error('Error adding tracking info:', error);
      return {
        order: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to add tracking info' }]
      };
    }
  }

  // Get order by ID with items
  static async getOrder(orderId: string) {
    try {
      const client = getServerClient(); // Use server client for API operations
      const orderResult = await client.models.Order.get({ id: orderId });
      
      if (orderResult.errors && orderResult.errors.length > 0) {
        return {
          order: null,
          errors: orderResult.errors
        };
      }

      if (!orderResult.data) {
        return {
          order: null,
          errors: [{ message: 'Order not found' }]
        };
      }

      // Get order items
      const itemsResult = await client.models.OrderItem.list({
        filter: { orderId: { eq: orderId } }
      });

      const orderWithItems = {
        ...orderResult.data,
        items: itemsResult.data || []
      };

      return {
        order: orderWithItems,
        errors: null
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      return {
        order: null,
        errors: [{ message: error instanceof Error ? error.message : 'Failed to fetch order' }]
      };
    }
  }
}