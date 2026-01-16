// Order status management service for tracking orders from processing to delivery
import * as OrderService from '@/lib/services/order-service';
import { EmailService } from '@/lib/services/email';
import type { Order } from '@/types';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface StatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  allowedBy: 'system' | 'admin' | 'customer';
  requiresTracking?: boolean;
}

export interface DeliveryEstimate {
  estimatedDays: number;
  estimatedDate: Date;
  shippingMethod: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  newStatus: OrderStatus;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
  updatedBy: string; // user ID or 'system'
}

export class OrderStatusService {
  // Define valid status transitions
  private static readonly STATUS_TRANSITIONS: StatusTransition[] = [
    { from: 'pending', to: 'processing', allowedBy: 'system' },
    { from: 'pending', to: 'cancelled', allowedBy: 'customer' },
    { from: 'processing', to: 'shipped', allowedBy: 'admin', requiresTracking: true },
    { from: 'processing', to: 'cancelled', allowedBy: 'admin' },
    { from: 'shipped', to: 'delivered', allowedBy: 'admin' },
    { from: 'shipped', to: 'delivered', allowedBy: 'system' }, // Auto-delivery after estimated date
  ];

  // Shipping methods and their delivery estimates
  private static readonly SHIPPING_METHODS = {
    standard: { name: 'Standard Shipping', days: 7 },
    express: { name: 'Express Shipping', days: 3 },
    overnight: { name: 'Overnight Shipping', days: 1 },
  };

  /**
   * Calculate estimated delivery date based on shipping method and location
   */
  static calculateEstimatedDelivery(
    shippingState: string,
    shippingMethod: 'standard' | 'express' | 'overnight' = 'standard'
  ): DeliveryEstimate {
    const baseMethod = this.SHIPPING_METHODS[shippingMethod];
    let estimatedDays = baseMethod.days;

    // Add extra days for remote locations (simplified logic)
    const remoteStates = [
      'Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 
      'Nagaland', 'Sikkim', 'Tripura', 'Andaman and Nicobar Islands',
      'Lakshadweep', 'Ladakh'
    ];

    if (remoteStates.includes(shippingState)) {
      estimatedDays += 2; // Add 2 extra days for remote locations
    }

    // Calculate estimated date (excluding weekends for business days)
    const estimatedDate = this.addBusinessDays(new Date(), estimatedDays);

    return {
      estimatedDays,
      estimatedDate,
      shippingMethod: baseMethod.name
    };
  }

  /**
   * Add business days to a date (excluding weekends)
   */
  private static addBusinessDays(startDate: Date, businessDays: number): Date {
    const result = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        daysAdded++;
      }
    }

    return result;
  }

  /**
   * Validate if a status transition is allowed
   */
  static isValidTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    userRole: 'system' | 'admin' | 'customer'
  ): boolean {
    const transition = this.STATUS_TRANSITIONS.find(
      t => t.from === currentStatus && t.to === newStatus && t.allowedBy === userRole
    );
    return !!transition;
  }

  /**
   * Get customer email from user profile (Mock implementation)
   */
  private static async getCustomerEmail(customerId: string): Promise<string> {
    try {
      // Mock implementation - generate a mock email for development
      const mockEmail = `customer-${customerId.slice(-8)}@example.com`;
      console.log(`📧 Using mock email for customer ${customerId}: ${mockEmail}`);
      return mockEmail;
      
      // Real implementation would fetch from Cognito user attributes or UserProfile
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error getting customer email:', errorMessage);
      // Return mock email as fallback
      return `customer-${customerId.slice(-8)}@example.com`;
    }
  }

  /**
   * Update order status with validation and notifications
   */
  static async updateOrderStatus(update: OrderStatusUpdate): Promise<{
    success: boolean;
    order?: Order;
    error?: string;
  }> {
    try {
      // Get current order
      const orderResult = await OrderService.getOrder(update.orderId);
      if (!orderResult.order) {
        return { success: false, error: 'Order not found' };
      }

      const currentOrder = orderResult.order;
      const currentStatus = (currentOrder.status || 'pending') as OrderStatus;

      // Validate transition (assuming admin role for now)
      const userRole = update.updatedBy === 'system' ? 'system' : 'admin';
      if (!this.isValidTransition(currentStatus, update.newStatus, userRole)) {
        return {
          success: false,
          error: `Invalid status transition from ${currentStatus} to ${update.newStatus}`
        };
      }

      // Check if tracking number is required
      const transition = this.STATUS_TRANSITIONS.find(
        t => t.from === currentStatus && t.to === update.newStatus
      );
      
      if (transition?.requiresTracking && !update.trackingNumber) {
        return {
          success: false,
          error: 'Tracking number is required for this status update'
        };
      }

      // Calculate estimated delivery if shipping
      let estimatedDelivery = update.estimatedDelivery;
      if (update.newStatus === 'shipped' && !estimatedDelivery) {
        const deliveryEstimate = this.calculateEstimatedDelivery(
          currentOrder.shippingState,
          'standard' // Default to standard shipping
        );
        estimatedDelivery = deliveryEstimate.estimatedDate;
      }

      // Update order in database
      const updateData: any = {
        id: update.orderId,
        status: update.newStatus
      };

      if (update.trackingNumber) {
        updateData.trackingNumber = update.trackingNumber;
      }

      if (estimatedDelivery) {
        updateData.estimatedDelivery = estimatedDelivery.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }

      const updateResult = await OrderService.updateOrderStatus(update.orderId, update.newStatus);
      
      if (updateResult.errors && updateResult.errors.length > 0) {
        return {
          success: false,
          error: `Failed to update order: ${updateResult.errors.map(e => e.message).join(', ')}`
        };
      }

      // Send email notification to customer
      try {
        const customerEmail = await this.getCustomerEmail(currentOrder.customerId);
        await EmailService.sendOrderStatusUpdateEmail(
          customerEmail,
          update.orderId,
          currentOrder.confirmationNumber || update.orderId,
          update.newStatus,
          update.trackingNumber
        );
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the entire operation if email fails
      }

      return {
        success: true,
        order: updateResult.order ? {
          id: updateResult.order.id,
          customerId: updateResult.order.customerId,
          subtotal: updateResult.order.subtotal,
          tax: updateResult.order.tax || 0,
          shipping: updateResult.order.shipping || 0,
          totalAmount: updateResult.order.totalAmount,
          status: updateResult.order.status as OrderStatus || 'pending',
          confirmationNumber: updateResult.order.confirmationNumber || undefined,
          paymentOrderId: updateResult.order.paymentOrderId || undefined,
          trackingNumber: updateResult.order.trackingNumber || undefined,
          estimatedDelivery: updateResult.order.estimatedDelivery || undefined,
          shippingFirstName: updateResult.order.shippingFirstName,
          shippingLastName: updateResult.order.shippingLastName,
          shippingAddressLine1: updateResult.order.shippingAddressLine1,
          shippingAddressLine2: updateResult.order.shippingAddressLine2 || undefined,
          shippingCity: updateResult.order.shippingCity,
          shippingState: updateResult.order.shippingState,
          shippingPostalCode: updateResult.order.shippingPostalCode,
          shippingCountry: updateResult.order.shippingCountry,
          billingFirstName: updateResult.order.billingFirstName,
          billingLastName: updateResult.order.billingLastName,
          billingAddressLine1: updateResult.order.billingAddressLine1,
          billingAddressLine2: updateResult.order.billingAddressLine2 || undefined,
          billingCity: updateResult.order.billingCity,
          billingState: updateResult.order.billingState,
          billingPostalCode: updateResult.order.billingPostalCode,
          billingCountry: updateResult.order.billingCountry,
          createdAt: updateResult.order.createdAt,
          updatedAt: updateResult.order.updatedAt,
        } as Order : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error updating order status:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get order tracking information
   */
  static async getOrderTracking(orderId: string): Promise<{
    success: boolean;
    tracking?: {
      orderId: string;
      status: OrderStatus;
      trackingNumber?: string;
      estimatedDelivery?: Date;
      statusHistory: Array<{
        status: OrderStatus;
        timestamp: Date;
        notes?: string;
      }>;
    };
    error?: string;
  }> {
    try {
      const orderResult = await OrderService.getOrder(orderId);
      if (!orderResult.order) {
        return { success: false, error: 'Order not found' };
      }

      const order = orderResult.order;

      // For now, create a simple status history based on current status
      // In a real implementation, this would come from a status history table
      const statusHistory = this.generateStatusHistory(
        order.status as OrderStatus || 'pending',
        new Date(order.createdAt),
        order.updatedAt ? new Date(order.updatedAt) : new Date()
      );

      return {
        success: true,
        tracking: {
          orderId: order.id,
          status: (order.status as OrderStatus) || 'pending',
          trackingNumber: order.trackingNumber || undefined,
          estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
          statusHistory
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error getting order tracking:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate status history based on current status (simplified implementation)
   */
  private static generateStatusHistory(
    currentStatus: OrderStatus,
    createdAt: Date,
    updatedAt: Date
  ): Array<{ status: OrderStatus; timestamp: Date; notes?: string }> {
    const history: Array<{ status: OrderStatus; timestamp: Date; notes?: string }> = [];

    // Always start with pending
    history.push({
      status: 'pending',
      timestamp: createdAt,
      notes: 'Order placed and payment pending'
    });

    // Add subsequent statuses based on current status
    if (['processing', 'shipped', 'delivered'].includes(currentStatus)) {
      history.push({
        status: 'processing',
        timestamp: new Date(createdAt.getTime() + (1000 * 60 * 60)), // 1 hour after creation
        notes: 'Payment confirmed, order being processed'
      });
    }

    if (['shipped', 'delivered'].includes(currentStatus)) {
      history.push({
        status: 'shipped',
        timestamp: new Date(createdAt.getTime() + (1000 * 60 * 60 * 24 * 2)), // 2 days after creation
        notes: 'Order shipped and on the way'
      });
    }

    if (currentStatus === 'delivered') {
      history.push({
        status: 'delivered',
        timestamp: updatedAt,
        notes: 'Order delivered successfully'
      });
    }

    if (currentStatus === 'cancelled') {
      history.push({
        status: 'cancelled',
        timestamp: updatedAt,
        notes: 'Order cancelled'
      });
    }

    return history;
  }

  /**
   * Get orders that need status updates (for automated processing)
   */
  static async getOrdersForStatusUpdate(): Promise<{
    success: boolean;
    orders?: Array<{
      orderId: string;
      currentStatus: OrderStatus;
      suggestedAction: string;
      reason: string;
    }>;
    error?: string;
  }> {
    try {
      // TODO: Implement getOrdersByStatus function in order-service
      // For now, return empty suggestions
      /*
      // Get all processing and shipped orders
      const processingOrders = await OrderService.getOrdersByStatus('processing');
      const shippedOrders = await OrderService.getOrdersByStatus('shipped');

      const suggestions: Array<{
        orderId: string;
        currentStatus: OrderStatus;
        suggestedAction: string;
        reason: string;
      }> = [];

      // Check processing orders that might be ready to ship
      processingOrders.orders.forEach(order => {
        const daysSinceProcessing = Math.floor(
          (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceProcessing >= 2) {
          suggestions.push({
            orderId: order.id,
            currentStatus: 'processing',
            suggestedAction: 'Mark as shipped',
            reason: `Order has been processing for ${daysSinceProcessing} days`
          });
        }
      });

      // Check shipped orders that might be delivered
      shippedOrders.orders.forEach(order => {
        if (order.estimatedDelivery) {
          const estimatedDate = new Date(order.estimatedDelivery);
          const today = new Date();
          
          if (today >= estimatedDate) {
            suggestions.push({
              orderId: order.id,
              currentStatus: 'shipped',
              suggestedAction: 'Mark as delivered',
              reason: 'Estimated delivery date has passed'
            });
          }
        }
      });
      */

      return {
        success: true,
        orders: []
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error getting orders for status update:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Auto-update orders based on business rules
   */
  static async autoUpdateOrderStatuses(): Promise<{
    success: boolean;
    updatedOrders?: string[];
    error?: string;
  }> {
    try {
      const suggestionsResult = await this.getOrdersForStatusUpdate();
      if (!suggestionsResult.success || !suggestionsResult.orders) {
        return { success: false, error: 'Failed to get order suggestions' };
      }

      const updatedOrders: string[] = [];

      // Auto-update orders that have passed their estimated delivery date
      for (const suggestion of suggestionsResult.orders) {
        if (suggestion.suggestedAction === 'Mark as delivered' && 
            suggestion.reason.includes('Estimated delivery date has passed')) {
          
          const updateResult = await this.updateOrderStatus({
            orderId: suggestion.orderId,
            newStatus: 'delivered',
            updatedBy: 'system',
            notes: 'Auto-updated based on estimated delivery date'
          });

          if (updateResult.success) {
            updatedOrders.push(suggestion.orderId);
          }
        }
      }

      return {
        success: true,
        updatedOrders
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error auto-updating order statuses:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}