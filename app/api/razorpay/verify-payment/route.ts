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

    // Generate simple confirmation number
    const confirmationNumber = `CONF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    return NextResponse.json({
      success: true,
      confirmationNumber,
      orderId,
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}