// API route to generate and download PDF invoice for an order
import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/data/orders';
import { PDFInvoiceService } from '@/lib/services/pdf-invoice';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Get order details
    const orderResponse = await OrderService.getOrder(orderId);
    if (!orderResponse.order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get order items
    const orderItemsResponse = await OrderService.getOrderItems(orderId);
    const orderItems = orderItemsResponse.items || [];

    // Generate PDF invoice
    const pdfBuffer = await PDFInvoiceService.generateInvoice(
      orderResponse.order as any,
      orderItems as any
    );

    // Generate filename
    const filename = PDFInvoiceService.generateInvoiceFilename(orderResponse.order as any);

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}