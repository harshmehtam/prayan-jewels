// Email service for sending transactional emails (Mock implementation for development)
import type { OrderItem } from '@/types';

// Mock email service - replace with actual AWS SES implementation when ready
const USE_MOCK_EMAIL = process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID;

interface OrderConfirmationEmailData {
  orderId: string;
  confirmationNumber: string;
  customerEmail: string;
  orderDetails: {
    items: OrderItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    totalAmount: number;
    shippingAddress: {
      firstName: string;
      lastName: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
}

export class EmailService {
  private static readonly FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@silvermangalsutra.com';
  private static readonly COMPANY_NAME = 'Silver Mangalsutra Store';

  /**
   * Send order confirmation email to customer
   */
  static async sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<void> {
    try {
      const { orderId, confirmationNumber, customerEmail, orderDetails } = data;

      if (USE_MOCK_EMAIL) {
        // Mock email implementation for development
        console.log('📧 MOCK EMAIL - Order Confirmation');
        console.log('To:', customerEmail);
        console.log('Subject: Order Confirmation -', confirmationNumber);
        console.log('Order ID:', orderId);
        console.log('Total Amount: ₹' + orderDetails.totalAmount.toFixed(2));
        console.log('Items:', orderDetails.items.map(item => `${item.productName} x${item.quantity}`).join(', '));
        console.log('Shipping Address:', `${orderDetails.shippingAddress.firstName} ${orderDetails.shippingAddress.lastName}, ${orderDetails.shippingAddress.city}`);
        console.log('✅ Mock email sent successfully');
        return;
      }

      // Real AWS SES implementation would go here
      // For now, we'll use the mock implementation
      throw new Error('AWS SES not configured. Using mock email service.');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error sending order confirmation email:', errorMessage);
      
      // Don't throw error for mock implementation
      if (USE_MOCK_EMAIL) {
        console.log('📧 MOCK EMAIL - Fallback confirmation logged');
        return;
      }
      
      throw new Error(`Failed to send order confirmation email: ${errorMessage}`);
    }
  }

  /**
   * Send order status update email to customer
   */
  static async sendOrderStatusUpdateEmail(
    customerEmail: string,
    orderId: string,
    confirmationNumber: string,
    newStatus: string,
    trackingNumber?: string,
    estimatedDelivery?: Date
  ): Promise<void> {
    try {
      if (USE_MOCK_EMAIL) {
        // Mock email implementation for development
        console.log('📧 MOCK EMAIL - Order Status Update');
        console.log('To:', customerEmail);
        console.log('Subject:', `Order Update - ${confirmationNumber} - ${this.getStatusDisplayName(newStatus)}`);
        console.log('Order ID:', orderId);
        console.log('New Status:', this.getStatusDisplayName(newStatus));
        console.log('Status Message:', this.getStatusMessage(newStatus));
        
        if (trackingNumber) {
          console.log('Tracking Number:', trackingNumber);
        }
        
        if (estimatedDelivery) {
          console.log('Estimated Delivery:', estimatedDelivery.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }));
        }
        
        console.log('✅ Mock status update email sent successfully');
        return;
      }

      // Real AWS SES implementation would go here
      throw new Error('AWS SES not configured. Using mock email service.');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error sending order status update email:', errorMessage);
      
      // Don't throw error for mock implementation
      if (USE_MOCK_EMAIL) {
        console.log('📧 MOCK EMAIL - Fallback status update logged');
        return;
      }
      
      throw new Error(`Failed to send order status update email: ${errorMessage}`);
    }
  }

  /**
   * Get appropriate message for order status
   */
  private static getStatusMessage(status: string): string {
    switch (status) {
      case 'processing':
        return 'Your order is being processed and will be shipped soon.';
      case 'shipped':
        return 'Your order has been shipped and is on its way to you.';
      case 'delivered':
        return 'Your order has been delivered. We hope you love your new mangalsutra!';
      case 'cancelled':
        return 'Your order has been cancelled. If you have any questions, please contact our support team.';
      default:
        return 'Your order status has been updated.';
    }
  }

  /**
   * Get display name for order status
   */
  private static getStatusDisplayName(status: string): string {
    switch (status) {
      case 'pending':
        return 'Order Pending';
      case 'processing':
        return 'Order Processing';
      case 'shipped':
        return 'Order Shipped';
      case 'delivered':
        return 'Order Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      default:
        return 'Order Updated';
    }
  }

  /**
   * Send order cancellation confirmation email to customer
   */
  static async sendOrderCancellationEmail(
    customerEmail: string,
    orderId: string,
    confirmationNumber: string
  ): Promise<void> {
    try {
      if (USE_MOCK_EMAIL) {
        // Mock email implementation for development
        console.log('📧 MOCK EMAIL - Order Cancellation Confirmation');
        console.log('To:', customerEmail);
        console.log('Subject:', `Order Cancelled - ${confirmationNumber}`);
        console.log('Order ID:', orderId);
        console.log('Message: Your order has been successfully cancelled. Refund will be processed within 5-7 business days.');
        console.log('✅ Mock cancellation email sent successfully');
        return;
      }

      // Real AWS SES implementation would go here
      throw new Error('AWS SES not configured. Using mock email service.');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error sending order cancellation email:', errorMessage);
      
      // Don't throw error for mock implementation
      if (USE_MOCK_EMAIL) {
        console.log('📧 MOCK EMAIL - Fallback cancellation confirmation logged');
        return;
      }
      
      throw new Error(`Failed to send order cancellation email: ${errorMessage}`);
    }
  }

  /**
   * Send order modification request email to admin/support team
   */
  static async sendOrderModificationRequestEmail(
    adminEmail: string,
    orderId: string,
    confirmationNumber: string,
    modificationType: string,
    details: string,
    newShippingAddress?: {
      firstName: string;
      lastName: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }
  ): Promise<void> {
    try {
      if (USE_MOCK_EMAIL) {
        // Mock email implementation for development
        console.log('📧 MOCK EMAIL - Order Modification Request (Admin)');
        console.log('To:', adminEmail);
        console.log('Subject:', `Order Modification Request - ${confirmationNumber}`);
        console.log('Order ID:', orderId);
        console.log('Modification Type:', modificationType);
        console.log('Details:', details);
        
        if (newShippingAddress) {
          console.log('New Shipping Address:');
          console.log(`  ${newShippingAddress.firstName} ${newShippingAddress.lastName}`);
          console.log(`  ${newShippingAddress.addressLine1}`);
          if (newShippingAddress.addressLine2) {
            console.log(`  ${newShippingAddress.addressLine2}`);
          }
          console.log(`  ${newShippingAddress.city}, ${newShippingAddress.state} ${newShippingAddress.postalCode}`);
          console.log(`  ${newShippingAddress.country}`);
        }
        
        console.log('Action Required: Review and approve/reject modification request');
        console.log('✅ Mock modification request email sent successfully');
        return;
      }

      // Real AWS SES implementation would go here
      throw new Error('AWS SES not configured. Using mock email service.');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error sending order modification request email:', errorMessage);
      
      // Don't throw error for mock implementation
      if (USE_MOCK_EMAIL) {
        console.log('📧 MOCK EMAIL - Fallback modification request logged');
        return;
      }
      
      throw new Error(`Failed to send order modification request email: ${errorMessage}`);
    }
  }
}