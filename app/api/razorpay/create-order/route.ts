import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { OrderService } from '@/lib/data/orders';
import { validateRazorpayBasicConfig } from '@/lib/config/razorpay';
import type { CreateOrderInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating Razorpay order...');

    // Validate Razorpay configuration first
    validateRazorpayBasicConfig();

    const body = await request.json();
    const { orderData }: { orderData: CreateOrderInput } = body;

    console.log('Order data received:', JSON.stringify(orderData, null, 2));

    // Validate required fields
    if (!orderData.customerId || !orderData.items || orderData.items.length === 0) {
      console.error('Missing required order data');
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

    console.log('Order totals calculated:', { subtotal, tax, shipping, totalAmount });

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Create Razorpay order FIRST - this is the critical part for payment
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Amount in paise (smallest currency unit)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`, // Use timestamp as receipt
      notes: {
        customerId: orderData.customerId,
        totalAmount: totalAmount.toString(),
        itemCount: orderData.items.length.toString()
      },
    });

    console.log('Razorpay order created successfully:', razorpayOrder.id);

    // Try to create order in our database, but don't fail if it doesn't work
    let internalOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    let databaseOrderCreated = false;

    try {
      const orderResult = await OrderService.createOrder(orderData);
      
      if (orderResult.order) {
        internalOrderId = orderResult.order.id;
        databaseOrderCreated = true;
        console.log('Database order created successfully:', internalOrderId);
        
        // Update our order with Razorpay order ID
        try {
          await OrderService.updateOrderPayment(internalOrderId, razorpayOrder.id);
          console.log('Order updated with Razorpay payment ID');
        } catch (updateError) {
          console.error('Failed to update order with payment ID:', updateError);
          // Continue anyway - payment can still proceed
        }
      }
    } catch (dbError) {
      console.error('Database order creation failed, but continuing with Razorpay payment:', dbError);
      // We'll use the generated order ID and handle the database later
      databaseOrderCreated = false;
    }

    // Always return success if Razorpay order was created
    return NextResponse.json({
      success: true,
      orderId: internalOrderId, // Our internal order ID (real or generated)
      razorpayOrder: {
        id: razorpayOrder.id, // Razorpay's order ID
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
      databaseOrderCreated, // Flag to indicate if database order was created
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to create payment order';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error) {
      if (error.message.includes('key_id')) {
        errorMessage = 'Razorpay configuration error';
        errorDetails = 'Invalid Razorpay key ID';
      } else if (error.message.includes('key_secret')) {
        errorMessage = 'Razorpay configuration error';
        errorDetails = 'Invalid Razorpay key secret';
      } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        errorMessage = 'Network error';
        errorDetails = 'Unable to connect to Razorpay servers';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}