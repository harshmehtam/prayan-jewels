'use server';

import { revalidatePath } from 'next/cache';
import { createRazorpayOrder, verifyRazorpayPayment, getPaymentStatus } from '@/lib/services/razorpay';
import { createOrder, updatePaymentStatus, generateGuestCustomerId } from '@/lib/services/order-service';
import type { CreateOrderData } from '@/lib/services/order-service';
import type { CartItem } from '@/types';

interface CreateOrderInput {
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  couponId?: string;
  couponCode?: string;
  couponDiscount?: number;
}

/**
 * Create Razorpay order and internal order
 */
export async function createRazorpayOrderAction(orderData: CreateOrderInput) {
  try {
    console.log('Creating Razorpay order via action...');

    // Validate required fields
    if (!orderData.customerId || !orderData.items || orderData.items.length === 0) {
      console.error('Missing required order data');
      return {
        success: false,
        error: 'Missing required order data',
      };
    }

    // Calculate order totals
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.18; // 18% GST
    const shipping = subtotal > 2000 ? 0 : 100; // Free shipping above ₹2000
    const couponDiscount = orderData.couponDiscount || 0;
    const totalAmount = subtotal + tax + shipping - couponDiscount;

    // Create Razorpay order FIRST
    const razorpayResult = await createRazorpayOrder(
      totalAmount,
      orderData.customerId,
      orderData.items.length
    );

    if (!razorpayResult.success || !razorpayResult.order) {
      return {
        success: false,
        error: razorpayResult.error || 'Failed to create payment order',
      };
    }

    // Create order in our database
    let internalOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let databaseOrderCreated = false;

    try {
      // For guest users, ensure we have a proper unique customer ID
      let finalCustomerId = orderData.customerId;
      if (orderData.customerId === 'guest' || orderData.customerId.startsWith('guest_')) {
        finalCustomerId = generateGuestCustomerId(
          orderData.customerEmail || '', 
          orderData.customerPhone || ''
        );
      }

      // Convert CreateOrderInput to the format expected by OrderService
      const orderServiceData: CreateOrderData = {
        customerId: finalCustomerId,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        items: orderData.items.map((item, index) => ({
          id: `temp_${index}_${Date.now()}`,
          cartId: 'temp_cart',
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })) as CartItem[],
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        paymentMethod: 'razorpay',
        subtotal,
        tax,
        shipping,
        couponId: orderData.couponId,
        couponCode: orderData.couponCode,
        couponDiscount,
        totalAmount,
        paymentOrderId: razorpayResult.order.id as string,
      };

      const orderResult = await createOrder(orderServiceData);
      
      if (orderResult.success && orderResult.orderId) {
        internalOrderId = orderResult.orderId;
        databaseOrderCreated = true;
        
        revalidatePath('/account/orders');
        revalidatePath('/checkout');
      }
    } catch (dbError) {
      console.error('Failed to create order in database:', dbError);
      databaseOrderCreated = false;
    }

    // Always return success if Razorpay order was created
    return {
      success: true,
      orderId: internalOrderId,
      razorpayOrder: razorpayResult.order,
      orderDetails: {
        subtotal,
        tax,
        shipping,
        totalAmount,
      },
      databaseOrderCreated,
    };
  } catch (error) {
    let errorMessage = 'Failed to create payment order';
    
    if (error instanceof Error) {
      if (error.message.includes('key_id')) {
        errorMessage = 'Razorpay configuration error: Invalid key ID';
      } else if (error.message.includes('key_secret')) {
        errorMessage = 'Razorpay configuration error: Invalid key secret';
      } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        errorMessage = 'Network error: Unable to connect to Razorpay servers';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify Razorpay payment
 */
export async function verifyRazorpayPaymentAction(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  orderId: string
) {
  try {
    // Validate required fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return {
        success: false,
        error: 'Missing required payment verification data',
      };
    }

    // Verify payment signature
    const verificationResult = await verifyRazorpayPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!verificationResult.success) {
      return {
        success: false,
        error: verificationResult.error || 'Invalid payment signature',
      };
    }

    // Update payment status in database
    const updateResult = await updatePaymentStatus(orderId, 'paid', razorpayPaymentId);

    if (!updateResult) {
      console.error('Failed to update payment status in database');
      // Don't fail the verification, just log the error
      console.log('Payment verified but database update failed');
    }

    // Generate confirmation number
    const confirmationNumber = `CONF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    revalidatePath('/account/orders');
    revalidatePath(`/account/orders/${orderId}`);

    return {
      success: true,
      confirmationNumber,
      orderId,
      paymentId: razorpayPaymentId,
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: 'Payment verification failed',
    };
  }
}

/**
 * Get payment status from Razorpay
 */
export async function getPaymentStatusAction(paymentId: string) {
  try {
    if (!paymentId) {
      return {
        success: false,
        error: 'Payment ID is required',
      };
    }

    const result = await getPaymentStatus(paymentId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch payment status',
      };
    }

    return {
      success: true,
      payment: result.payment,
    };
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return {
      success: false,
      error: 'Failed to fetch payment status',
    };
  }
}
