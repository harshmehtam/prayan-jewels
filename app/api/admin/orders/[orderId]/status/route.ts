// API endpoint for updating order status (Admin only)
import { NextRequest, NextResponse } from 'next/server';
import { OrderStatusService, type OrderStatusUpdate } from '@/lib/services/order-status';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // For now, we'll use a mock admin user ID
    // In a real implementation, this would come from authentication
    const adminUserId = 'admin-user-123';

    const statusUpdate: OrderStatusUpdate = {
      orderId,
      newStatus: body.status,
      trackingNumber: body.trackingNumber,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
      notes: body.notes,
      updatedBy: adminUserId
    };

    const result = await OrderStatusService.updateOrderStatus(statusUpdate);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: `Failed to update order status: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const result = await OrderStatusService.getOrderTracking(orderId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tracking: result.tracking
    });

  } catch (error) {
    console.error('Error getting order tracking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: `Failed to get order tracking: ${errorMessage}` },
      { status: 500 }
    );
  }
}