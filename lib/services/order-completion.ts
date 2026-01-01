// Order completion service for handling post-payment workflows
import { OrderService } from '@/lib/data/orders';
import { InventoryService } from '@/lib/data/inventory';
import { EmailService } from '@/lib/services/email';
import { client } from '@/lib/amplify-client';

export class OrderCompletionService {
  /**
   * Generate a unique order confirmation number
   * Format: ORD-YYYYMMDD-HHMMSS-XXXX (where XXXX is random)
   */
  static generateOrderConfirmationNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Generate 4-digit random number
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }

  /**
   * Get customer email from Cognito user attributes
   */
  private static async getCustomerEmail(customerId: string): Promise<string> {
    try {
      // Get user profile from database first
      const profileResponse = await client.models.UserProfile.list({
        filter: { userId: { eq: customerId } }
      });
      
      const userProfile = profileResponse.data?.[0];
      
      // If we have a profile, we can get email from Cognito
      if (userProfile) {
        // For now, we'll use a mock email based on user ID
        // In production, you would fetch from Cognito user attributes
        const mockEmail = `user-${customerId.slice(-8)}@example.com`;
        console.log(`📧 Using email for customer ${customerId}: ${mockEmail}`);
        return mockEmail;
        
        // Real implementation would use Cognito Admin API:
        // const cognitoClient = new CognitoIdentityProviderClient({ region: 'ap-south-1' });
        // const command = new AdminGetUserCommand({
        //   UserPoolId: process.env.COGNITO_USER_POOL_ID,
        //   Username: customerId
        // });
        // const response = await cognitoClient.send(command);
        // const emailAttribute = response.UserAttributes?.find(attr => attr.Name === 'email');
        // return emailAttribute?.Value || mockEmail;
      }
      
      // Fallback to mock email
      const fallbackEmail = `customer-${customerId.slice(-8)}@example.com`;
      console.log(`📧 Using fallback email for customer ${customerId}: ${fallbackEmail}`);
      return fallbackEmail;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error getting customer email:', errorMessage);
      // Return mock email as fallback
      return `customer-${customerId.slice(-8)}@example.com`;
    }
  }

  /**
   * Complete the order workflow after successful payment
   * This includes:
   * 1. Generating order confirmation number
   * 2. Updating inventory levels
   * 3. Sending confirmation email
   * 4. Updating order status
   */
  static async completeOrderWorkflow(orderId: string, paymentId: string): Promise<{
    success: boolean;
    confirmationNumber?: string;
    error?: string;
  }> {
    try {
      // Generate unique confirmation number
      const confirmationNumber = this.generateOrderConfirmationNumber();

      // Get order details
      const orderResult = await OrderService.getOrder(orderId);
      if (!orderResult.order) {
        throw new Error('Order not found');
      }

      const order = orderResult.order;

      // Get order items
      const orderItemsResult = await OrderService.getOrderItems(orderId);
      const orderItems = orderItemsResult.items;

      // Update inventory levels for all items
      const inventoryUpdatePromises = orderItems.map(async (item) => {
        try {
          // Confirm inventory (this reduces stock and releases reserved quantity)
          await InventoryService.confirmInventory(item.productId, item.quantity);
          return { success: true, productId: item.productId };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(`Failed to update inventory for product ${item.productId}:`, errorMessage);
          return { success: false, productId: item.productId, error: errorMessage };
        }
      });

      const inventoryResults = await Promise.all(inventoryUpdatePromises);
      
      // Check if any inventory updates failed
      const failedUpdates = inventoryResults.filter(result => !result.success);
      if (failedUpdates.length > 0) {
        console.warn('Some inventory updates failed:', failedUpdates);
        // Continue with order completion even if some inventory updates fail
        // This prevents order completion from failing due to inventory sync issues
      }

      // Update order with confirmation number and payment details
      await OrderService.updateOrderWithConfirmation(orderId, {
        confirmationNumber,
        paymentId,
        status: 'processing'
      });

      // Send order confirmation email
      try {
        const customerEmail = await this.getCustomerEmail(order.customerId);
        
        await EmailService.sendOrderConfirmationEmail({
          orderId,
          confirmationNumber,
          customerEmail,
          orderDetails: {
            items: orderItems.map(item => ({
              id: item.id,
              orderId: item.orderId,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            })),
            subtotal: order.subtotal || 0,
            tax: order.tax || 0,
            shipping: order.shipping || 0,
            totalAmount: order.totalAmount,
            shippingAddress: {
              firstName: order.shippingFirstName,
              lastName: order.shippingLastName,
              addressLine1: order.shippingAddressLine1,
              addressLine2: order.shippingAddressLine2,
              city: order.shippingCity,
              state: order.shippingState,
              postalCode: order.shippingPostalCode,
              country: order.shippingCountry
            }
          }
        });
      } catch (emailError) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error occurred';
        console.error('Failed to send confirmation email:', errorMessage);
        // Don't fail the entire workflow if email fails
        // The order is still completed successfully
      }

      return {
        success: true,
        confirmationNumber
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error completing order workflow:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Handle payment failure workflow
   * This includes:
   * 1. Releasing reserved inventory
   * 2. Updating order status to cancelled
   * 3. Sending payment failure notification (optional)
   */
  static async handlePaymentFailure(orderId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get order items to release inventory
      const orderItemsResult = await OrderService.getOrderItems(orderId);
      const orderItems = orderItemsResult.items;

      // Release reserved inventory for all items
      const releasePromises = orderItems.map(async (item) => {
        try {
          await InventoryService.releaseReservedInventory(item.productId, item.quantity);
          return { success: true, productId: item.productId };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(`Failed to release inventory for product ${item.productId}:`, errorMessage);
          return { success: false, productId: item.productId, error: errorMessage };
        }
      });

      await Promise.all(releasePromises);

      // Update order status to cancelled
      await OrderService.updateOrderStatus(orderId, 'cancelled');

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error handling payment failure:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validate order completion requirements
   * Ensures all prerequisites are met before completing the order
   */
  static async validateOrderCompletion(orderId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check if order exists
      const orderResult = await OrderService.getOrder(orderId);
      if (!orderResult.order) {
        errors.push('Order not found');
        return { valid: false, errors };
      }

      const order = orderResult.order;

      // Check order status
      if (order.status !== 'pending') {
        errors.push(`Order status is ${order.status}, expected 'pending'`);
      }

      // Check if order has items
      const orderItemsResult = await OrderService.getOrderItems(orderId);
      if (!orderItemsResult.items || orderItemsResult.items.length === 0) {
        errors.push('Order has no items');
      }

      // Check inventory availability for all items
      for (const item of orderItemsResult.items) {
        const inventoryResult = await InventoryService.getProductInventory(item.productId);
        if (!inventoryResult.inventory) {
          errors.push(`No inventory record found for product ${item.productId}`);
          continue;
        }

        const inventory = inventoryResult.inventory;
        if ((inventory.reservedQuantity || 0) < item.quantity) {
          errors.push(`Insufficient reserved inventory for product ${item.productId}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      errors.push(`Validation error: ${errorMessage}`);
      return { valid: false, errors };
    }
  }
}