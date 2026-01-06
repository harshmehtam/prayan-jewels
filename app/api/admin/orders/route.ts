// API route for admin order management
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminContext } from '@/lib/auth/admin-auth';
import { client } from '@/lib/amplify-client';

// GET /api/admin/orders - Get all orders for admin management
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter conditions
    const filterConditions: any = {};
    if (status) {
      filterConditions.status = { eq: status };
    }

    const response = await client.models.Order.list({
      filter: filterConditions,
      limit,
      // Note: Amplify doesn't support offset directly, you'd need to implement pagination differently
    });

    if (!response.data) {
      return NextResponse.json({ orders: [], totalCount: 0 });
    }

    // Transform the data for admin view
    const orders = response.data.map(order => ({
      id: order.id,
      customerId: order.customerId,
      confirmationNumber: order.confirmationNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: {
        firstName: order.shippingFirstName,
        lastName: order.shippingLastName,
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
    }));

    return NextResponse.json({
      orders,
      totalCount: orders.length,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/orders:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders - Update order status
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    const adminContext = createAdminContext(auth, request);
    
    const body = await request.json();
    const { orderId, status, trackingNumber, estimatedDelivery } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Update the order
    const updateData: any = {};
    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery) updateData.estimatedDelivery = estimatedDelivery;

    const response = await client.models.Order.update({
      id: orderId,
      ...updateData,
    });

    if (!response.data) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // Log the admin action
    try {
      const { AdminAuditService } = await import('@/lib/services/admin-audit');
      await AdminAuditService.logOrderAction(
        adminContext,
        'order_updated',
        orderId,
        `Order status updated to ${status}`,
        { updateData },
        true
      );
    } catch (auditError) {
      console.error('Failed to log admin action:', auditError);
    }

    return NextResponse.json({
      success: true,
      order: response.data,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/orders:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}