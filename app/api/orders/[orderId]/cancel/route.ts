import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/data/orders';
import { EmailService } from '@/lib/services/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get the order first to validate cancellation eligibility
    const orderResult = await OrderService.getOrder(orderId);
    
    if (!orderResult.order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderResult.order;

    // Check if order is eligible for cancellation
    const eligibleStatuses = ['pending', 'processing'];
    if (!order.status || !eligibleStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      );
    }

    // Check if within cancellation timeframe (24 hours)
    const orderDate = new Date(order.createdAt);
    const cancellationDeadline = new Date(orderDate.getTime() + (24 * 60 * 60 * 1000));
    const now = new Date();

    if (now > cancellationDeadline) {
      return NextResponse.json(
        { success: false, error: 'Cancellation period has expired. Please contact customer support.' },
        { status: 400 }
      );
    }

    // Cancel the order
    const cancelResult = await OrderService.cancelOrder(orderId);

    if (cancelResult.errors && cancelResult.errors.length > 0) {
      return NextResponse.json(
        { success: false, error: `Failed to cancel order: ${cancelResult.errors.map(e => e.message).join(', ')}` },
        { status: 500 }
      );
    }

    // Send cancellation confirmation email
    try {
      // Mock customer email for development
      const customerEmail = `customer-${order.customerId.slice(-8)}@example.com`;
      
      await EmailService.sendOrderCancellationEmail(
        customerEmail,
        orderId,
        order.confirmationNumber || orderId
      );
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the entire operation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully. Refund will be processed within 5-7 business days.',
      order: cancelResult.order
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}