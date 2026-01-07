// Email service for sending transactional emails using AWS SES
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { OrderItem } from '@/types';

// Use mock email service in development or when AWS credentials are not configured
const USE_MOCK_EMAIL = process.env.NODE_ENV === 'development' || 
  !process.env.AWS_ACCESS_KEY_ID || 
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.SES_FROM_EMAIL;

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
  private static readonly AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

  // Initialize SES client
  private static getSESClient() {
    if (USE_MOCK_EMAIL) {
      return null;
    }

    return new SESClient({
      region: this.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Send email using AWS SES
   */
  private static async sendEmail(
    toEmail: string,
    subject: string,
    htmlBody: string,
    textBody?: string
  ): Promise<void> {
    if (USE_MOCK_EMAIL) {
      console.log('📧 MOCK EMAIL');
      console.log('To:', toEmail);
      console.log('Subject:', subject);
      console.log('Body:', textBody || htmlBody.replace(/<[^>]*>/g, ''));
      console.log('✅ Mock email sent successfully');
      return;
    }

    const sesClient = this.getSESClient();
    if (!sesClient) {
      throw new Error('SES client not configured');
    }

    const command = new SendEmailCommand({
      Source: this.FROM_EMAIL,
      Destination: {
        ToAddresses: [toEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: textBody ? {
            Data: textBody,
            Charset: 'UTF-8',
          } : undefined,
        },
      },
    });

    try {
      await sesClient.send(command);
      console.log('✅ Email sent successfully via AWS SES to:', toEmail);
    } catch (error) {
      console.error('❌ Failed to send email via AWS SES:', error);
      throw error;
    }
  }

  /**
   * Generate HTML template for order confirmation
   */
  private static generateOrderConfirmationHTML(data: OrderConfirmationEmailData): string {
    const { confirmationNumber, orderDetails } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .order-details { background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .total { font-weight: bold; font-size: 18px; color: #28a745; }
          .address { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.COMPANY_NAME}</h1>
            <h2>Order Confirmation</h2>
            <p><strong>Order Number:</strong> ${confirmationNumber}</p>
          </div>
          
          <div class="order-details">
            <h3>Order Items</h3>
            ${orderDetails.items.map(item => `
              <div class="item">
                <strong>${item.productName}</strong><br>
                Quantity: ${item.quantity} × ₹${item.unitPrice.toFixed(2)} = ₹${item.totalPrice.toFixed(2)}
              </div>
            `).join('')}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
              <p>Subtotal: ₹${orderDetails.subtotal.toFixed(2)}</p>
              <p>Tax (GST): ₹${orderDetails.tax.toFixed(2)}</p>
              <p>Shipping: ₹${orderDetails.shipping.toFixed(2)}</p>
              <p class="total">Total: ₹${orderDetails.totalAmount.toFixed(2)}</p>
            </div>
          </div>
          
          <div class="address">
            <h3>Shipping Address</h3>
            <p>
              ${orderDetails.shippingAddress.firstName} ${orderDetails.shippingAddress.lastName}<br>
              ${orderDetails.shippingAddress.addressLine1}<br>
              ${orderDetails.shippingAddress.addressLine2 ? orderDetails.shippingAddress.addressLine2 + '<br>' : ''}
              ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} ${orderDetails.shippingAddress.postalCode}<br>
              ${orderDetails.shippingAddress.country}
            </p>
          </div>
          
          <p>Thank you for your order! We'll send you updates as your order is processed and shipped.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send order confirmation email to customer
   */
  static async sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<void> {
    try {
      const { confirmationNumber, customerEmail } = data;
      
      const subject = `Order Confirmation - ${confirmationNumber}`;
      const htmlBody = this.generateOrderConfirmationHTML(data);
      const textBody = `
        Order Confirmation - ${confirmationNumber}
        
        Thank you for your order from ${this.COMPANY_NAME}!
        
        Order Details:
        ${data.orderDetails.items.map(item => 
          `${item.productName} x${item.quantity} - ₹${item.totalPrice.toFixed(2)}`
        ).join('\n')}
        
        Total: ₹${data.orderDetails.totalAmount.toFixed(2)}
        
        Shipping Address:
        ${data.orderDetails.shippingAddress.firstName} ${data.orderDetails.shippingAddress.lastName}
        ${data.orderDetails.shippingAddress.addressLine1}
        ${data.orderDetails.shippingAddress.addressLine2 || ''}
        ${data.orderDetails.shippingAddress.city}, ${data.orderDetails.shippingAddress.state} ${data.orderDetails.shippingAddress.postalCode}
        ${data.orderDetails.shippingAddress.country}
        
        We'll send you updates as your order is processed and shipped.
      `;

      await this.sendEmail(customerEmail, subject, htmlBody, textBody);
      
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
      const subject = `Order Update - ${confirmationNumber} - ${this.getStatusDisplayName(newStatus)}`;
      
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
            .status-update { background: #e7f3ff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007bff; }
            .tracking { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.COMPANY_NAME}</h1>
              <h2>Order Status Update</h2>
              <p><strong>Order Number:</strong> ${confirmationNumber}</p>
            </div>
            
            <div class="status-update">
              <h3>${this.getStatusDisplayName(newStatus)}</h3>
              <p>${this.getStatusMessage(newStatus)}</p>
              ${trackingNumber ? `
                <div class="tracking">
                  <strong>Tracking Number:</strong> ${trackingNumber}
                </div>
              ` : ''}
              ${estimatedDelivery ? `
                <p><strong>Estimated Delivery:</strong> ${estimatedDelivery.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              ` : ''}
            </div>
            
            <p>Thank you for choosing ${this.COMPANY_NAME}!</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </body>
        </html>
      `;

      const textBody = `
        Order Status Update - ${confirmationNumber}
        
        Status: ${this.getStatusDisplayName(newStatus)}
        Message: ${this.getStatusMessage(newStatus)}
        ${trackingNumber ? `Tracking Number: ${trackingNumber}` : ''}
        ${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery.toLocaleDateString('en-IN')}` : ''}
        
        Thank you for choosing ${this.COMPANY_NAME}!
      `;

      await this.sendEmail(customerEmail, subject, htmlBody, textBody);
      
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