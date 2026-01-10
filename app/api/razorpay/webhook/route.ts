import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OrderService } from '@/lib/data/orders';
import { validateRazorpayBasicConfig, isWebhookConfigured, razorpayConfig } from '@/lib/config/razorpay';

export async function POST(request: NextRequest) {
  try {
    // Validate basic Razorpay configuration
    validateRazorpayBasicConfig();
    
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // In test mode, webhook signature verification is optional
    if (isWebhookConfigured() && signature) {
      // Verify webhook signature only if webhook secret is configured
      const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.webhookSecret!)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }
    } else if (!razorpayConfig.isTestMode && !isWebhookConfigured()) {
      // In production, webhook secret is required
      return NextResponse.json(
        { error: 'Webhook secret not configured for production mode' },
        { status: 400 }
      );
    } else if (razorpayConfig.isTestMode && !signature) {
      // In test mode without webhook secret, log a warning but continue
      console.warn('⚠️  Test mode: Processing webhook without signature verification');
    }

    const event = JSON.parse(body);
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error processing webhook:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: errorMessage },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    const orderId = payment.notes?.orderId;
    if (orderId) {
      console.log(`✅ Payment captured for order ${orderId}, payment ${payment.id}`);
      // Update order status to 'processing' directly
      await OrderService.updateOrderStatus(orderId, 'processing');
      console.log(`✅ Order ${orderId} marked as processing`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error handling payment captured:', errorMessage);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    const orderId = payment.notes?.orderId;
    if (orderId) {
      console.log(`❌ Payment failed for order ${orderId}`);
      // Update order status to 'cancelled' directly
      await OrderService.updateOrderStatus(orderId, 'cancelled');
      console.log(`✅ Order ${orderId} marked as cancelled`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error handling payment failed:', errorMessage);
  }
}

async function handleOrderPaid(order: any) {
  try {
    const orderId = order.receipt;
    if (orderId) {
      console.log(`✅ Order paid for order ${orderId}`);
      // Update order status to 'processing' directly
      await OrderService.updateOrderStatus(orderId, 'processing');
      console.log(`✅ Order ${orderId} marked as processing`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error handling order paid:', errorMessage);
  }
}