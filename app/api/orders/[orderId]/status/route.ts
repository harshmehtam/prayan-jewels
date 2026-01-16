import { NextResponse } from 'next/server';
import { cookiesClient } from '@/utils/amplify-utils';

export async function GET(
  request: Request,
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

    const client = await cookiesClient;

    // Get order details
    const orderResult = await client.models.Order.get(
      { id: orderId },
      { authMode: 'iam' }
    );

    if (!orderResult.data) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderResult.data;

    // Build tracking information
    const trackingInfo = {
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
      statusHistory: [
        {
          status: order.status,
          timestamp: new Date(order.updatedAt || order.createdAt),
          notes: getStatusNotes(order.status || 'pending')
        }
      ]
    };

    return NextResponse.json({
      success: true,
      tracking: trackingInfo
    });
  } catch (error) {
    console.error('Error fetching order status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch order status' 
      },
      { status: 500 }
    );
  }
}

function getStatusNotes(status: string): string {
  switch (status) {
    case 'pending':
      return 'Order received and awaiting payment confirmation';
    case 'processing':
      return 'Order is being prepared for shipment';
    case 'shipped':
      return 'Order has been shipped and is on its way';
    case 'delivered':
      return 'Order has been successfully delivered';
    case 'cancelled':
      return 'Order has been cancelled';
    default:
      return 'Order status updated';
  }
}
