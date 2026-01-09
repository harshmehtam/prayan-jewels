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
  private static readonly FROM_EMAIL = process.env.SES_FROM_EMAIL;
  private static readonly COMPANY_NAME = 'Prayan Jewels';
  private static readonly AWS_REGION = process.env.AWS_REGION;

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
      console.log('📧 MOCK EMAIL: Order confirmation sent to', toEmail);
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
   * Send order shipping notification email to customer
   */
  static async sendOrderShippingEmail(
    customerEmail: string,
    orderId: string,
    confirmationNumber: string,
    trackingNumber?: string,
    estimatedDelivery?: Date
  ): Promise<void> {
    try {
      const subject = `Order Shipped - ${confirmationNumber} - Your Order is On Its Way!`;
      
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Shipped</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px; }
            .shipping-info { background: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745; }
            .tracking { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; text-align: center; }
            .tracking-number { font-size: 18px; font-weight: bold; color: #007bff; }
            .delivery-info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Order Shipped!</h1>
              <h2>${this.COMPANY_NAME}</h2>
              <p><strong>Order Number:</strong> ${confirmationNumber}</p>
            </div>
            
            <div class="shipping-info">
              <h3>🚚 Your Order is On Its Way!</h3>
              <p>Great news! Your order has been shipped and is now on its way to you. We've carefully packaged your beautiful mangalsutra and it's ready to make someone special very happy!</p>
              
              ${trackingNumber ? `
                <div class="tracking">
                  <p><strong>Track Your Package:</strong></p>
                  <div class="tracking-number">${trackingNumber}</div>
                  <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    Use this tracking number on your courier's website to get real-time updates
                  </p>
                </div>
              ` : ''}
              
              ${estimatedDelivery ? `
                <div class="delivery-info">
                  <p><strong>📅 Estimated Delivery:</strong></p>
                  <p style="font-size: 16px; font-weight: bold;">
                    ${estimatedDelivery.toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              ` : ''}
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 What to Expect:</h3>
              <ul style="padding-left: 20px;">
                <li>You'll receive SMS updates as your package moves</li>
                <li>Our delivery partner will call before delivery</li>
                <li>Please keep your phone handy for delivery coordination</li>
                <li>Ensure someone is available to receive the package</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 18px; color: #28a745;">
                <strong>Thank you for choosing ${this.COMPANY_NAME}!</strong>
              </p>
              <p>We hope you love your new mangalsutra. If you have any questions about your order or delivery, please don't hesitate to contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `
        Order Shipped - ${confirmationNumber}
        
        Great news! Your order from ${this.COMPANY_NAME} has been shipped!
        
        ${trackingNumber ? `Tracking Number: ${trackingNumber}` : ''}
        ${estimatedDelivery ? `Estimated Delivery: ${estimatedDelivery.toLocaleDateString('en-IN')}` : ''}
        
        What to Expect:
        - You'll receive SMS updates as your package moves
        - Our delivery partner will call before delivery
        - Please keep your phone handy for delivery coordination
        - Ensure someone is available to receive the package
        
        Thank you for choosing ${this.COMPANY_NAME}!
      `;

      await this.sendEmail(customerEmail, subject, htmlBody, textBody);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error sending order shipping email:', errorMessage);
      
      // Don't throw error for mock implementation
      if (USE_MOCK_EMAIL) {
        console.log('📧 MOCK EMAIL - Fallback shipping notification logged');
        return;
      }
      
      throw new Error(`Failed to send order shipping email: ${errorMessage}`);
    }
  }
  static async sendOrderCancellationEmail(
    customerEmail: string,
    orderId: string,
    confirmationNumber: string
  ): Promise<void> {
    try {
      if (USE_MOCK_EMAIL) {
        console.log('📧 MOCK EMAIL: Order cancellation sent to', customerEmail);
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
        console.log('📧 MOCK EMAIL: Order modification request sent to admin');
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