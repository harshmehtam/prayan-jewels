// API endpoint for automated order status updates
import { NextRequest, NextResponse } from 'next/server';
import { OrderStatusService } from '@/lib/services/order-status';

export async function POST(request: NextRequest) {
  try {
    // This endpoint would typically be called by a cron job or scheduled task
    // For security, you might want to add authentication or API key validation here
    
    const result = await OrderStatusService.autoUpdateOrderStatuses();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.updatedOrders?.length || 0} orders`,
      updatedOrders: result.updatedOrders
    });

  } catch (error) {
    console.error('Error in auto-update orders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: `Failed to auto-update orders: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get orders that need status updates (for monitoring/dashboard purposes)
    const result = await OrderStatusService.getOrdersForStatusUpdate();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions: result.orders || []
    });

  } catch (error) {
    console.error('Error getting order suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: `Failed to get order suggestions: ${errorMessage}` },
      { status: 500 }
    );
  }
}