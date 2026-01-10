import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/order-service';
import type { CartItem, Address } from '@/types';

export interface CreateOrderRequest {
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  shippingAddress: Partial<Address>;
  billingAddress: Partial<Address>;
  paymentMethod: 'razorpay' | 'cash_on_delivery';
  subtotal: number;
  tax: number;
  shipping: number;
  couponId?: string;
  couponCode?: string;
  couponDiscount?: number;
  totalAmount: number;
  paymentOrderId?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📦 API: Creating order...');
    
    const orderData: CreateOrderRequest = await request.json();

    // Validate required fields
    if (!orderData.customerId || !orderData.customerEmail || !orderData.items || orderData.items.length === 0) {
      console.error('❌ API: Missing required order data');
      return NextResponse.json(
        { success: false, error: 'Missing required order data' },
        { status: 400 }
      );
    }

    if (!orderData.shippingAddress || !orderData.billingAddress) {
      console.error('❌ API: Missing address data');
      return NextResponse.json(
        { success: false, error: 'Shipping and billing addresses are required' },
        { status: 400 }
      );
    }

    // For guest users, ensure we have a proper unique customer ID
    let finalCustomerId = orderData.customerId;
    if (orderData.customerId === 'guest' || orderData.customerId.startsWith('guest_')) {
      // Generate a consistent guest customer ID based on email and phone
      finalCustomerId = OrderService.generateGuestCustomerId(
        orderData.customerEmail, 
        orderData.customerPhone
      );
      console.log('🔄 API: Generated guest customer ID:', finalCustomerId);
    }

    // Update the order data with the final customer ID
    const finalOrderData = {
      ...orderData,
      customerId: finalCustomerId
    };
    
    // Create the order using the server-side service
    const orderResult = await OrderService.createOrder(finalOrderData);

    if (!orderResult.success) {
      console.error('❌ API: OrderService failed:', orderResult.error);
      return NextResponse.json(
        { success: false, error: orderResult.error || 'Failed to create order' },
        { status: 500 }
      );
    }

    console.log('✅ API: Order created successfully:', orderResult.orderId);

    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      confirmationNumber: orderResult.confirmationNumber
    });

  } catch (error) {
    console.error('❌ API: Error creating order:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}