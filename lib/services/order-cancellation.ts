// Server-side order cancellation service using Amplify Gen2
import { cookiesClient } from '@/utils/amplify-utils';
import { EmailService } from './email';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

/**
 * Get SNS client with proper credentials
 */
function getSNSClient(): SNSClient | null {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('AWS credentials not configured for SMS service');
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

/**
 * Send SMS using AWS SNS
 */
// async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
//   try {
//     const snsClient = getSNSClient();
//     if (!snsClient) {
//       console.log('SMS service not configured - skipping SMS notification');
//       return false;
//     }

//     // Format phone number for international format
//     const cleanPhone = phoneNumber.replace(/\D/g, '');
//     const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;

//     const command = new PublishCommand({
//       PhoneNumber: formattedPhone,
//       Message: message,
//     });

//     const result = await snsClient.send(command);
//     console.log('SMS sent successfully:', result.MessageId);
//     return true;
//   } catch (error) {
//     console.error('Error sending SMS:', error);
//     return false;
//   }
// }

/**
 * Send cancellation notifications (email and SMS)
 */
async function sendCancellationNotifications(
  order: any,
  confirmationNumber: string
): Promise<void> {
  try {
    // Send cancellation email
    try {
      await EmailService.sendOrderCancellationEmail(
        order.customerEmail,
        order.id,
        confirmationNumber
      );
      console.log('Order cancellation email sent via AWS SES');
    } catch (emailError) {
      console.error('Failed to send cancellation email via AWS SES:', emailError);
      console.log('Order cancelled successfully without email notification');
    }

    // Send SMS notification using AWS SNS
    // if (order.customerPhone) {
    //   try {
    //     const smsMessage = `Order Cancelled: Your order #${confirmationNumber} has been cancelled. ${
    //       order.paymentStatus === 'paid' 
    //         ? 'Refund will be processed within 5-7 business days.' 
    //         : ''
    //     } Thank you.`;
        
    //     await sendSMS(order.customerPhone, smsMessage);
    //   } catch (smsError) {
    //     console.error('Failed to send cancellation SMS via AWS SNS:', smsError);
    //     console.log('Order cancelled successfully without SMS notification');
    //   }
    // }
  } catch (error) {
    console.error('Error in cancellation notification process:', error);
    console.log('Order cancelled successfully without notifications');
  }
}

export class OrderCancellationService {
  // Cancel order for authenticated users (orders created while logged in)
  static async cancelOrderForUser(orderId: string, customerId: string) {
    try {
      const client = await cookiesClient;
      
      // First, get the order to validate cancellation eligibility
      const orderResult = await client.models.Order.get({ id: orderId });
      
      if (orderResult.errors && orderResult.errors.length > 0) {
        throw new Error(`Failed to fetch order: ${orderResult.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (!orderResult.data) {
        throw new Error('Order not found');
      }

      const order = orderResult.data;

      // Validate that this is an authenticated user's order (not a guest order)
      if (order.customerId !== customerId) {
        throw new Error('You are not authorized to cancel this order');
      }

      // Additional check: Ensure this is not a guest order
      if (order.customerId.startsWith('guest_')) {
        throw new Error('Guest orders cannot be cancelled through this method. Please use the track order page.');
      }

      // Check if order can be cancelled
      const eligibleStatuses = ['pending', 'processing'];
      if (!order.status || !eligibleStatuses.includes(order.status)) {
        let errorMessage = 'Order cannot be cancelled at this stage';
        
        switch (order.status) {
          case 'shipped':
            errorMessage = 'Order has already been shipped and cannot be cancelled. Please contact customer support for returns.';
            break;
          case 'delivered':
            errorMessage = 'Order has been delivered and cannot be cancelled. Please contact customer support for returns.';
            break;
          case 'cancelled':
            errorMessage = 'Order has already been cancelled.';
            break;
          case 'refunded':
            errorMessage = 'Order has already been refunded.';
            break;
        }
        
        throw new Error(errorMessage);
      }

      // Cancel the order
      const updateResult = await client.models.Order.update({
        id: orderId,
        status: 'cancelled'
      });

      if (updateResult.errors && updateResult.errors.length > 0) {
        throw new Error(`Failed to cancel order: ${updateResult.errors.map((e: any) => e.message).join(', ')}`);
      }

      // Handle refund for paid orders
      if (order.paymentStatus === 'paid') {
        await client.models.Order.update({
          id: orderId,
          paymentStatus: 'refunded'
        });
      }

      console.log(' Authenticated user order cancelled successfully:', { orderId, customerId, confirmationNumber: order.confirmationNumber });

      // Send notifications (non-blocking)
      const confirmationNumber = order.confirmationNumber || orderId;
      sendCancellationNotifications(order, confirmationNumber);

      return {
        success: true,
        order: updateResult.data,
        message: order.paymentStatus === 'paid' 
          ? 'Order cancelled successfully. Refund will be processed within 5-7 business days.'
          : 'Order cancelled successfully.'
      };
    } catch (error) {
      console.error('Error cancelling authenticated user order:', error);
      throw error;
    }
  }

  // Cancel order for guest users (orders created as guest)
  static async cancelOrderForGuest(orderId: string, email: string, phone: string) {
    try {
      const client = await cookiesClient;
      
      // First, get the order to validate cancellation eligibility
      const orderResult = await client.models.Order.get({ id: orderId }, { authMode: 'iam' });
      
      if (orderResult.errors && orderResult.errors.length > 0) {
        throw new Error(`Failed to fetch order: ${orderResult.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (!orderResult.data) {
        throw new Error('Order not found');
      }

      const order = orderResult.data;

      // Validate that this is a guest order
      if (!order.customerId.startsWith('guest_')) {
        throw new Error('This order belongs to a registered user. Please sign in to cancel it.');
      }

      // Validate guest credentials
      const emailMatch = order.customerEmail.toLowerCase() === email.toLowerCase();
      const phoneMatch = order.customerPhone.replace(/\D/g, '') === phone.replace(/\D/g, '');
      
      if (!emailMatch || !phoneMatch) {
        throw new Error('Order credentials do not match');
      }

      // Check if order can be cancelled
      const eligibleStatuses = ['pending', 'processing'];
      if (!order.status || !eligibleStatuses.includes(order.status)) {
        let errorMessage = 'Order cannot be cancelled at this stage';
        
        switch (order.status) {
          case 'shipped':
            errorMessage = 'Order has already been shipped and cannot be cancelled. Please contact customer support for returns.';
            break;
          case 'delivered':
            errorMessage = 'Order has been delivered and cannot be cancelled. Please contact customer support for returns.';
            break;
          case 'cancelled':
            errorMessage = 'Order has already been cancelled.';
            break;
          case 'refunded':
            errorMessage = 'Order has already been refunded.';
            break;
        }
        
        throw new Error(errorMessage);
      }

      // Cancel the order
      const updateResult = await client.models.Order.update({
        id: orderId,
        status: 'cancelled'
      }, { authMode: 'iam' });

      if (updateResult.errors && updateResult.errors.length > 0) {
        throw new Error(`Failed to cancel order: ${updateResult.errors.map((e: any) => e.message).join(', ')}`);
      }

      // Handle refund for paid orders
      if (order.paymentStatus === 'paid') {
        await client.models.Order.update({
          id: orderId,
          paymentStatus: 'refunded'
        }, { authMode: 'iam' });
      }

      console.log('Guest order cancelled successfully:', { orderId, email, confirmationNumber: order.confirmationNumber });

      // Send notifications (non-blocking)
      const confirmationNumber = order.confirmationNumber || orderId;
      sendCancellationNotifications(order, confirmationNumber);

      return {
        success: true,
        order: updateResult.data,
        message: order.paymentStatus === 'paid' 
          ? 'Order cancelled successfully. Refund will be processed within 5-7 business days.'
          : 'Order cancelled successfully.'
      };
    } catch (error) {
      console.error('Error cancelling guest order:', error);
      throw error;
    }
  }

  // Check if order can be cancelled
  static canCancelOrder(order: any): boolean {
    const eligibleStatuses = ['pending', 'processing'];
    return order.status && eligibleStatuses.includes(order.status);
  }

  // Check if order belongs to authenticated user (not guest)
  static isAuthenticatedUserOrder(order: any): boolean {
    return order.customerId && !order.customerId.startsWith('guest_');
  }

  // Check if order belongs to guest user
  static isGuestOrder(order: any): boolean {
    return order.customerId && order.customerId.startsWith('guest_');
  }

  // Get cancellation reason message
  static getCancellationReasonMessage(orderStatus: string): string {
    switch (orderStatus) {
      case 'shipped':
        return 'Order has already been shipped and cannot be cancelled. Please contact customer support for returns.';
      case 'delivered':
        return 'Order has been delivered and cannot be cancelled. Please contact customer support for returns.';
      case 'cancelled':
        return 'Order has already been cancelled.';
      case 'refunded':
        return 'Order has already been refunded.';
      default:
        return 'Order cannot be cancelled at this stage.';
    }
  }
}