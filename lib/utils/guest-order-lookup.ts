// Guest order lookup utilities
import { OrderService } from '@/lib/services/order-service';

export class GuestOrderLookup {
  // Generate guest customer ID from email and phone (same logic as order creation)
  static generateGuestCustomerId(email: string, phone: string): string {
    const identifier = `${email.toLowerCase()}_${phone.replace(/\D/g, '')}`;
    const hash = btoa(identifier).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    return `guest_${hash}`;
  }

  // Find orders for a guest user by email and phone
  static async findGuestOrders(email: string, phone: string) {
    try {
      const guestCustomerId = this.generateGuestCustomerId(email, phone);
      console.log('🔍 Looking up guest orders for customer ID:', guestCustomerId);
      
      const orders = await OrderService.getCustomerOrders(guestCustomerId);
      
      console.log(`📦 Found ${orders.length} orders for guest customer`);
      return orders;
    } catch (error) {
      console.error('❌ Error finding guest orders:', error);
      return [];
    }
  }

  // Find a specific order by confirmation number and verify it belongs to the guest
  static async findGuestOrderByConfirmation(
    confirmationNumber: string, 
    email: string, 
    phone: string
  ) {
    try {
      const order = await OrderService.getOrderByConfirmationNumber(confirmationNumber);
      
      if (!order) {
        return null;
      }

      // Verify the order belongs to this guest by checking email and phone
      if (order.customerEmail.toLowerCase() === email.toLowerCase() && 
          order.customerPhone.replace(/\D/g, '') === phone.replace(/\D/g, '')) {
        return order;
      }

      // Order exists but doesn't belong to this guest
      console.warn('🚫 Order found but email/phone mismatch');
      return null;
    } catch (error) {
      console.error('❌ Error finding guest order by confirmation:', error);
      return null;
    }
  }

  // Validate guest credentials match an order
  static validateGuestOrder(order: any, email: string, phone: string): boolean {
    if (!order) return false;
    
    const orderEmail = order.customerEmail?.toLowerCase() || '';
    const orderPhone = order.customerPhone?.replace(/\D/g, '') || '';
    const inputEmail = email.toLowerCase();
    const inputPhone = phone.replace(/\D/g, '');
    
    return orderEmail === inputEmail && orderPhone === inputPhone;
  }
}