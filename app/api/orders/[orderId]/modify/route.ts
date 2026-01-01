import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/data/orders';
import { EmailService } from '@/lib/services/email';

interface ModificationRequest {
  type: 'address_change' | 'item_quantity' | 'add_item';
  details: string;
  newShippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const modificationRequest: ModificationRequest = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!modificationRequest.type || !modificationRequest.details) {
      return NextResponse.json(
        { success: false, error: 'Modification type and details are required' },
        { status: 400 }
      );
    }

    // Get the order first to validate modification eligibility
    const orderResult = await OrderService.getOrder(orderId);
    
    if (!orderResult.order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderResult.order;

    // Check if order is eligible for modification
    const eligibleStatuses = ['pending', 'processing'];
    if (!order.status || !eligibleStatuses.includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Order cannot be modified at this stage' },
        { status: 400 }
      );
    }

    // Check if within modification timeframe (12 hours)
    const orderDate = new Date(order.createdAt);
    const modificationDeadline = new Date(orderDate.getTime() + (12 * 60 * 60 * 1000));
    const now = new Date();

    if (now > modificationDeadline) {
      return NextResponse.json(
        { success: false, error: 'Modification period has expired. Please contact customer support.' },
        { status: 400 }
      );
    }

    // Handle address change modification
    if (modificationRequest.type === 'address_change' && modificationRequest.newShippingAddress) {
      const newAddress = modificationRequest.newShippingAddress;
      
      // Validate address fields
      if (!newAddress.firstName || !newAddress.lastName || !newAddress.addressLine1 || 
          !newAddress.city || !newAddress.state || !newAddress.postalCode || !newAddress.country) {
        return NextResponse.json(
          { success: false, error: 'All address fields are required' },
          { status: 400 }
        );
      }

      // For now, we'll store modification requests as a log entry
      // In a real implementation, this would go to a ModificationRequest table
      console.log('Order modification request:', {
        orderId,
        type: modificationRequest.type,
        details: modificationRequest.details,
        newAddress,
        requestedAt: new Date().toISOString()
      });

      // Send notification email to admin/support team
      try {
        const adminEmail = 'admin@silvermangalsutra.com';
        await EmailService.sendOrderModificationRequestEmail(
          adminEmail,
          orderId,
          order.confirmationNumber || orderId,
          modificationRequest.type,
          modificationRequest.details,
          modificationRequest.newShippingAddress
        );
      } catch (emailError) {
        console.error('Failed to send modification request email:', emailError);
        // Don't fail the entire operation if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Address change request submitted successfully. Our team will contact you within 2 hours to confirm the modification.',
        requestId: `MOD-${orderId}-${Date.now()}`
      });
    }

    // Handle other modification types (item quantity, add item)
    console.log('Order modification request:', {
      orderId,
      type: modificationRequest.type,
      details: modificationRequest.details,
      requestedAt: new Date().toISOString()
    });

    // Send notification email to admin/support team
    try {
      const adminEmail = 'admin@silvermangalsutra.com';
      await EmailService.sendOrderModificationRequestEmail(
        adminEmail,
        orderId,
        order.confirmationNumber || orderId,
        modificationRequest.type,
        modificationRequest.details
      );
    } catch (emailError) {
      console.error('Failed to send modification request email:', emailError);
      // Don't fail the entire operation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Modification request submitted successfully. Our team will contact you within 2 hours to confirm if the modification can be processed.',
      requestId: `MOD-${orderId}-${Date.now()}`
    });

  } catch (error) {
    console.error('Error processing modification request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}