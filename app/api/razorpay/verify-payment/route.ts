import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OrderService } from '@/lib/data/orders';
import { InventoryService } from '@/lib/data/inventory';
import { OrderCompletionService } from '@/lib/services/order-completion';
import { validateRazorpayBasicConfig } from '@/lib/config/razorpay';

export async function POST(request: NextRequest) {
  try {
    // Validate basic Razorpay configuration (no webhook required)
    validateRazorpayBasicConfig();
    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json(
        { error: 'Missing required payment verification data' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Validate order completion requirements
    const validationResult = await OrderCompletionService.validateOrderCompletion(orderId);
    if (!validationResult.valid) {
      console.error('Order completion validation failed:', validationResult.errors);
      return NextResponse.json(
        { error: 'Order validation failed', details: validationResult.errors },
        { status: 400 }
      );
    }

    // Complete the order workflow (confirmation number, inventory update, email)
    const completionResult = await OrderCompletionService.completeOrderWorkflow(
      orderId,
      razorpay_payment_id
    );

    if (!completionResult.success) {
      console.error('Order completion workflow failed:', completionResult.error);
      return NextResponse.json(
        { error: 'Failed to complete order workflow', details: completionResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order completed successfully',
      orderId,
      confirmationNumber: completionResult.confirmationNumber,
      paymentId: razorpay_payment_id,
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    // If there's an error, try to handle payment failure
    try {
      const body = await request.json();
      const { orderId } = body;
      if (orderId) {
        await OrderCompletionService.handlePaymentFailure(orderId);
      }
    } catch (failureError) {
      const failureMessage = failureError instanceof Error ? failureError.message : 'Unknown error occurred';
      console.error('Error handling payment failure:', failureMessage);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to verify payment', details: errorMessage },
      { status: 500 }
    );
  }
}