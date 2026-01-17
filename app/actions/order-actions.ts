'use server';

import { revalidatePath } from 'next/cache';
import * as OrderService from '@/lib/services/order-service';
import type { CreateOrderData, OrderResult } from '@/lib/services/order-service';

/**
 * Create a new order
 */
export async function createOrder(orderData: CreateOrderData): Promise<OrderResult> {
  try {
    const result = await OrderService.createOrder(orderData);
    
    if (result.success) {
      revalidatePath('/account/orders');
      revalidatePath('/checkout');
    }
    
    return result;
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: 'Failed to create order. Please try again.',
    };
  }
}

/**
 * Get customer orders
 */
export async function getCustomerOrders(customerId: string, limit?: number): Promise<Array<Record<string, unknown>>> {
  try {
    return await OrderService.getCustomerOrders(customerId, limit);
  } catch (error) {
    console.error('Error getting customer orders:', error);
    return [];
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Record<string, unknown> | null> {
  try {
    return await OrderService.getOrderById(orderId);
  } catch (error) {
    console.error('Error getting order:', error);
    return null;
  }
}

/**
 * Get order by confirmation number
 */
export async function getOrderByConfirmationNumber(confirmationNumber: string): Promise<Record<string, unknown> | null> {
  try {
    return await OrderService.getOrderByConfirmationNumber(confirmationNumber);
  } catch (error) {
    console.error('Error getting order by confirmation number:', error);
    return null;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: 'paid' | 'failed' | 'refunded',
  paymentId?: string
): Promise<boolean> {
  try {
    const result = await OrderService.updatePaymentStatus(orderId, paymentStatus, paymentId);
    
    if (result) {
      revalidatePath('/account/orders');
      revalidatePath(`/account/orders/${orderId}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating payment status:', error);
    return false;
  }
}

/**
 * Update order payment info
 */
export async function updateOrderPayment(orderId: string, paymentOrderId: string): Promise<boolean> {
  try {
    return await OrderService.updateOrderPayment(orderId, paymentOrderId);
  } catch (error) {
    console.error('Error updating order payment:', error);
    return false;
  }
}
