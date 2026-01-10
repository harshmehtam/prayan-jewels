// Order data access layer
import { getClient, client, handleAmplifyError } from '@/lib/amplify-client';
import type { Order, OrderItem, CreateOrderInput } from '@/types';
import { InventoryService } from './inventory';

export class OrderService {
  // Generate unique guest customer ID based on email and phone
  static generateGuestCustomerId(email: string, phone: string): string {
    // Create a consistent hash-based ID for guest users
    // This allows the same guest to be identified across orders
    const identifier = `${email.toLowerCase()}_${phone.replace(/\D/g, '')}`;
    const hash = btoa(identifier).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    return `guest_${hash}`;
  }

  // Create a new order
  static async createOrder(orderData: CreateOrderInput) {
    try {
      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = subtotal * 0.18; // 18% GST
      const shipping = subtotal > 2000 ? 0 : 100; // Free shipping above ₹2000
      const totalAmount = subtotal + tax + shipping;

      // Create the order
      const orderResponse = await client.models.Order.create({
        customerId: orderData.customerId,
        customerEmail: orderData.customerEmail || '',
        customerPhone: orderData.customerPhone || '',
        subtotal,
        tax,
        shipping,
        totalAmount,
        status: 'pending',
        shippingFirstName: orderData.shippingAddress.firstName,
        shippingLastName: orderData.shippingAddress.lastName,
        shippingAddressLine1: orderData.shippingAddress.addressLine1,
        shippingAddressLine2: orderData.shippingAddress.addressLine2,
        shippingCity: orderData.shippingAddress.city,
        shippingState: orderData.shippingAddress.state,
        shippingPostalCode: orderData.shippingAddress.postalCode,
        shippingCountry: orderData.shippingAddress.country,
        billingFirstName: orderData.billingAddress.firstName,
        billingLastName: orderData.billingAddress.lastName,
        billingAddressLine1: orderData.billingAddress.addressLine1,
        billingAddressLine2: orderData.billingAddress.addressLine2,
        billingCity: orderData.billingAddress.city,
        billingState: orderData.billingAddress.state,
        billingPostalCode: orderData.billingAddress.postalCode,
        billingCountry: orderData.billingAddress.country,
      });

      if (!orderResponse.data) {
        throw new Error('Failed to create order');
      }

      // Create order items with proper product names
      const orderItemPromises = orderData.items.map(async (item) => {
        // Fetch the actual product to get the name
        const productResponse = await client.models.Product.get({ id: item.productId });
        const productName = productResponse.data?.name || `Product ${item.productId}`;

        return client.models.OrderItem.create({
          orderId: orderResponse.data!.id,
          productId: item.productId,
          productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        });
      });

      const orderItemsResponse = await Promise.all(orderItemPromises);

      return {
        order: orderResponse.data,
        orderItems: orderItemsResponse.map(response => response.data).filter(Boolean),
        errors: orderResponse.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get order by ID
  static async getOrder(orderId: string) {
    try {
      const response = await client.models.Order.get({ id: orderId });

      return {
        order: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get orders for a customer
  static async getCustomerOrders(customerId: string) {
    try {
      const response = await client.models.Order.list({
        filter: {
          customerId: { eq: customerId }
        }
      });

      return {
        orders: response.data || [],
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get order items for an order
  static async getOrderItems(orderId: string) {
    try {
      const response = await client.models.OrderItem.list({
        filter: {
          orderId: { eq: orderId }
        }
      });

      return {
        items: response.data || [],
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update order status
  static async updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      const response = await client.models.Order.update({
        id: orderId,
        status
      });

      return {
        order: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update order with payment information
  static async updateOrderPayment(orderId: string, paymentOrderId: string) {
    try {
      const response = await client.models.Order.update({
        id: orderId,
        paymentOrderId,
        status: 'processing'
      });

      return {
        order: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update order with confirmation details
  static async updateOrderWithConfirmation(orderId: string, data: {
    confirmationNumber: string;
    paymentId: string;
    status: Order['status'];
  }) {
    try {
      const response = await client.models.Order.update({
        id: orderId,
        confirmationNumber: data.confirmationNumber,
        paymentOrderId: data.paymentId,
        status: data.status
      });

      return {
        order: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Add tracking information to order
  static async addTrackingInfo(orderId: string, trackingNumber: string, estimatedDelivery?: string) {
    try {
      const updateData: any = {
        id: orderId,
        trackingNumber,
        status: 'shipped'
      };

      if (estimatedDelivery) {
        updateData.estimatedDelivery = estimatedDelivery;
      }

      const response = await client.models.Order.update(updateData);

      return {
        order: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Cancel order (if eligible)
  static async cancelOrder(orderId: string) {
    try {
      // Get the order first to check status
      const orderResponse = await this.getOrder(orderId);
      
      if (!orderResponse.order) {
        throw new Error('Order not found');
      }

      const order = orderResponse.order;

      // Check if order can be cancelled (only pending and processing orders)
      if (!order.status || !['pending', 'processing'].includes(order.status)) {
        throw new Error('Order cannot be cancelled at this stage');
      }

      // Update order status to cancelled
      const response = await client.models.Order.update({
        id: orderId,
        status: 'cancelled'
      });

      // Release reserved inventory
      const orderItemsResponse = await this.getOrderItems(orderId);
      const releasePromises = orderItemsResponse.items.map(item =>
        InventoryService.releaseReservedInventory(item.productId, item.quantity)
      );

      await Promise.all(releasePromises);

      return {
        order: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Complete order (confirm inventory and finalize)
  static async completeOrder(orderId: string) {
    try {
      // Get order items
      const orderItemsResponse = await this.getOrderItems(orderId);
      
      // Confirm inventory for all items
      const confirmPromises = orderItemsResponse.items.map(item =>
        InventoryService.confirmInventory(item.productId, item.quantity)
      );

      await Promise.all(confirmPromises);

      // Update order status
      const response = await client.models.Order.update({
        id: orderId,
        status: 'processing'
      });

      return {
        order: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get all orders (admin only)
  static async getAllOrders() {
    try {
      const response = await client.models.Order.list();

      return {
        orders: response.data || [],
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get orders by status (admin only)
  static async getOrdersByStatus(status: Order['status']) {
    try {
      if (status === null) {
        // Handle null status case - get orders with null status
        const response = await client.models.Order.list({
          filter: {
            status: { attributeExists: false }
          }
        });
        
        return {
          orders: response.data || [],
          errors: response.errors
        };
      }

      const response = await client.models.Order.list({
        filter: {
          status: { eq: status }
        }
      });

      return {
        orders: response.data || [],
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get order statistics (admin only)
  static async getOrderStatistics() {
    try {
      const allOrdersResponse = await this.getAllOrders();
      const orders = allOrdersResponse.orders;

      const stats = {
        totalOrders: orders.length,
        totalRevenue: orders
          .filter(order => order.status && ['processing', 'shipped', 'delivered'].includes(order.status))
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        processingOrders: orders.filter(order => order.status === 'processing').length,
        shippedOrders: orders.filter(order => order.status === 'shipped').length,
        deliveredOrders: orders.filter(order => order.status === 'delivered').length,
        cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
        refundedOrders: orders.filter(order => order.status === 'refunded').length,
      };

      return {
        stats,
        errors: null
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }
}