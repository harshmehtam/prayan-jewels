import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { OrderService } from '@/lib/data/orders';
import { validateRazorpayBasicConfig } from '@/lib/config/razorpay';
import type { CreateOrderInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Validate basic Razorpay configuration (no webhook required)
    validateRazorpayBasicConfig();

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const body = await request.json();
    const { orderData }: { orderData: CreateOrderInput } = body;

    // Validate required fields
    if (!orderData.customerId || !orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      );
    }

    // Calculate order totals
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.18; // 18% GST
    const shipping = subtotal > 2000 ? 0 : 100; // Free shipping above ₹2000
    const totalAmount = subtotal + tax + shipping;

    // Create order in our database first
    const orderResult = await OrderService.createOrder(orderData);
    
    if (!orderResult.order) {
      return NextResponse.json(
        { error: 'Failed to create order in database' },
        { status: 500 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Amount in paise (smallest currency unit)
      currency: 'INR',
      receipt: orderResult.order.id,
      notes: {
        orderId: orderResult.order.id,
        customerId: orderData.customerId,
      },
    });

    // Update our order with Razorpay order ID
    await OrderService.updateOrderPayment(orderResult.order.id, razorpayOrder.id);

    return NextResponse.json({
      success: true,
      orderId: orderResult.order.id,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
      orderDetails: {
        subtotal,
        tax,
        shipping,
        totalAmount,
      },
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}