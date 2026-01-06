import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { validateRazorpayBasicConfig } from '@/lib/config/razorpay';

export async function POST(request: NextRequest) {
  try {
    // Validate Razorpay configuration
    validateRazorpayBasicConfig();

    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId 
    } = body;

    console.log('Payment verification request:', { razorpay_order_id, razorpay_payment_id, orderId });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json(
        { error: 'Missing required payment verification data' },
        { status: 400 }
      );
    }

    // Verify payment signature - this is the most important part
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    console.log('Payment signature verified successfully');

    // Generate confirmation number
    const confirmationNumber = `CONF_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // For now, just verify payment without complex order completion
    console.log('Payment verified successfully for order:', orderId);

    // Always return success if payment signature is verified
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      orderId,
      confirmationNumber,
      paymentId: razorpay_payment_id,
      note: 'Payment completed successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to verify payment', details: errorMessage },
      { status: 500 }
    );
  }
}