import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { CartItem, Address } from '@/types';
import { EmailService } from './email';

const client = generateClient<Schema>();

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

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export class OrderService {
  // Generate unique confirmation number
  static generateConfirmationNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  // Send SMS using AWS SNS
  private static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
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
      const confirmationNumber = this.generateConfirmationNumber();
      
      // Create the order
      const orderResult = await client.models.Order.create({
        customerId: orderData.customerId,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
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
        throw new Error('Failed to create order');
      }

      const orderId = orderResult.data.id;

      // Create order items
      const orderItemPromises = orderData.items.map(async (item) => {
        // Get product name for the order item
        const productResult = await client.models.Product.get({ id: item.productId });
        const productName = productResult.data?.name || `Product ${item.productId}`;

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

      // Send notifications
      await this.sendOrderNotifications(orderData, confirmationNumber);

      console.log('✅ Order created successfully:', { orderId, confirmationNumber });

      return {
        success: true,
        orderId,
        confirmationNumber,
      };
    } catch (error) {
      console.error('❌ Error creating order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Send order notifications (email and SMS using AWS services)
  private static async sendOrderNotifications(orderData: CreateOrderData, confirmationNumber: string): Promise<void> {
    try {
      // Send email notification using AWS SES
      try {
        await EmailService.sendOrderConfirmationEmail({
          orderId: 'temp', // Will be updated with actual order ID
          confirmationNumber,
          customerEmail: orderData.customerEmail,
          orderDetails: {
            items: orderData.items.map(item => ({
              id: item.id,
              orderId: 'temp',
              productId: item.productId,
              productName: `Product ${item.productId}`, // You might want to fetch actual product names
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })),
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            shipping: orderData.shipping,
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
      }

      // Send SMS notification using AWS SNS
      if (orderData.customerPhone) {
        try {
          const smsMessage = `Order Confirmed! Order #${confirmationNumber}. Amount: ₹${orderData.totalAmount.toLocaleString()}. Payment: ${orderData.paymentMethod === 'cash_on_delivery' ? 'COD' : 'Paid Online'}. Thank you for your order!`;
          
          await this.sendSMS(orderData.customerPhone, smsMessage);
          console.log('✅ Order confirmation SMS sent via AWS SNS');
        } catch (smsError) {
          console.error('❌ Failed to send SMS via AWS SNS:', smsError);
        }
      }
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
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

  // Get order by ID
  static async getOrderById(orderId: string) {
    try {
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