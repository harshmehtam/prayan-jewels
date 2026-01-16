'use server';

import { revalidatePath } from 'next/cache';
import { OrderCancellationService } from '@/lib/services/order-cancellation';

/**
 * Cancel order for authenticated users
 */
export async function cancelOrderForUser(orderId: string, customerId: string) {
  try {
    const result = await OrderCancellationService.cancelOrderForUser(orderId, customerId);
    
    // Revalidate relevant paths
    revalidatePath('/account/orders');
    revalidatePath(`/account/orders/${orderId}`);
    revalidatePath('/admin/orders');
    
    return {
      success: true,
      message: result.message,
      order: result.order
    };
  } catch (error) {
    console.error('Error cancelling order for user:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel order. Please try again.',
      order: null
    };
  }
}

/**
 * Cancel order for guest users
 */
export async function cancelOrderForGuest(orderId: string, email: string, phone: string) {
  try {
    const result = await OrderCancellationService.cancelOrderForGuest(orderId, email, phone);
    
    // Revalidate admin orders path
    revalidatePath('/admin/orders');
    
    return {
      success: true,
      message: result.message,
      order: result.order
    };
  } catch (error) {
    console.error('Error cancelling order for guest:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel order. Please try again.',
      order: null
    };
  }
}
