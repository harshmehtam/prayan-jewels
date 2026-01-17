// PDF Invoice Generation Service for Indian E-commerce Bills
import jsPDF from 'jspdf';
import { Order, OrderItem } from '@/types';

export interface InvoiceData {
  order: Order;
  items: OrderItem[];
  companyDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
    phone: string;
    email: string;
  };
}

export class PDFInvoiceService {
  private static readonly COMPANY_DETAILS = {
    name: 'Silver Mangalsutra Store',
    address: '123 Jewelry Street, Commercial Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    gstin: '27XXXXX1234X1ZX', // Replace with actual GSTIN
    phone: '+91-9876543210',
    email: 'orders@silvermangalsutra.com'
  };

  // Generate PDF invoice for an order
  static async generateInvoice(order: Order, items: OrderItem[]): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Helper function to add text with automatic line wrapping
    const addText = (text: string, x: number, y: number, options?: { align?: 'left' | 'center' | 'right'; lineHeight?: number }) => {
      doc.text(text, x, y, options);
      return y + (options?.lineHeight || 6);
    };

    // Helper function to add a line
    const addLine = (x1: number, y1: number, x2: number, y2: number) => {
      doc.line(x1, y1, x2, y2);
    };

    // Header - Company Details
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    yPosition = addText(this.COMPANY_DETAILS.name, 20, yPosition);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(this.COMPANY_DETAILS.address, 20, yPosition);
    yPosition = addText(`${this.COMPANY_DETAILS.city}, ${this.COMPANY_DETAILS.state} - ${this.COMPANY_DETAILS.pincode}`, 20, yPosition);
    yPosition = addText(`Phone: ${this.COMPANY_DETAILS.phone} | Email: ${this.COMPANY_DETAILS.email}`, 20, yPosition);
    yPosition = addText(`GSTIN: ${this.COMPANY_DETAILS.gstin}`, 20, yPosition);

    // Invoice Title
    yPosition += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    yPosition = addText('TAX INVOICE', pageWidth / 2, yPosition, { align: 'center' });

    // Horizontal line
    yPosition += 5;
    addLine(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Invoice Details (Left) and Customer Details (Right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Left side - Invoice Details
    const leftX = 20;
    let leftY = yPosition;
    doc.setFont('helvetica', 'bold');
    leftY = addText('Invoice Details:', leftX, leftY);
    doc.setFont('helvetica', 'normal');
    leftY = addText(`Invoice No: ${order.confirmationNumber || order.id}`, leftX, leftY);
    leftY = addText(`Order ID: ${order.id}`, leftX, leftY);
    leftY = addText(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, leftX, leftY);
    leftY = addText(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, leftX, leftY);
    if (order.trackingNumber) {
      leftY = addText(`Tracking No: ${order.trackingNumber}`, leftX, leftY);
    }

    // Right side - Customer Details
    const rightX = pageWidth / 2 + 10;
    let rightY = yPosition;
    doc.setFont('helvetica', 'bold');
    rightY = addText('Bill To:', rightX, rightY);
    doc.setFont('helvetica', 'normal');
    rightY = addText(`${order.billingFirstName} ${order.billingLastName}`, rightX, rightY);
    rightY = addText(order.billingAddressLine1, rightX, rightY);
    if (order.billingAddressLine2) {
      rightY = addText(order.billingAddressLine2, rightX, rightY);
    }
    rightY = addText(`${order.billingCity}, ${order.billingState} - ${order.billingPostalCode}`, rightX, rightY);
    rightY = addText(order.billingCountry, rightX, rightY);
    if (order.customerEmail) {
      rightY = addText(`Email: ${order.customerEmail}`, rightX, rightY);
    }
    if (order.customerPhone) {
      rightY = addText(`Phone: ${order.customerPhone}`, rightX, rightY);
    }

    // Shipping Address (if different from billing)
    const shippingDifferent = 
      order.shippingAddressLine1 !== order.billingAddressLine1 ||
      order.shippingCity !== order.billingCity ||
      order.shippingState !== order.billingState;

    if (shippingDifferent) {
      rightY += 5;
      doc.setFont('helvetica', 'bold');
      rightY = addText('Ship To:', rightX, rightY);
      doc.setFont('helvetica', 'normal');
      rightY = addText(`${order.shippingFirstName} ${order.shippingLastName}`, rightX, rightY);
      rightY = addText(order.shippingAddressLine1, rightX, rightY);
      if (order.shippingAddressLine2) {
        rightY = addText(order.shippingAddressLine2, rightX, rightY);
      }
      rightY = addText(`${order.shippingCity}, ${order.shippingState} - ${order.shippingPostalCode}`, rightX, rightY);
      rightY = addText(order.shippingCountry, rightX, rightY);
    }

    // Update yPosition to the maximum of left and right sides
    yPosition = Math.max(leftY, rightY) + 15;

    // Items Table Header
    addLine(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('S.No', 25, yPosition);
    doc.text('Description', 45, yPosition);
    doc.text('Qty', 120, yPosition);
    doc.text('Rate (₹)', 140, yPosition);
    doc.text('Amount (₹)', 170, yPosition);

    yPosition += 5;
    addLine(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Items
    doc.setFont('helvetica', 'normal');
    
    items.forEach((item, index) => {
      doc.text((index + 1).toString(), 25, yPosition);
      
      // Handle long product names
      const productName = item.productName;
      if (productName.length > 30) {
        const lines = doc.splitTextToSize(productName, 70);
        doc.text(lines[0], 45, yPosition);
        if (lines.length > 1) {
          yPosition += 5;
          doc.text(lines[1], 45, yPosition);
        }
      } else {
        doc.text(productName, 45, yPosition);
      }
      
      doc.text(item.quantity.toString(), 120, yPosition);
      doc.text(item.unitPrice.toLocaleString('en-IN'), 140, yPosition);
      doc.text(item.totalPrice.toLocaleString('en-IN'), 170, yPosition);
      
      yPosition += 8;
    });

    // Subtotal line
    yPosition += 5;
    addLine(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Totals section
    const totalsX = 140;
    doc.setFont('helvetica', 'normal');
    
    doc.text('Subtotal:', totalsX, yPosition);
    doc.text(`₹${order.subtotal.toLocaleString('en-IN')}`, 170, yPosition);
    yPosition += 6;

    // GST Calculation (assuming 18% GST)
    const gstRate = 18;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    const gstAmount = order.tax || 0;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;

    if (gstAmount > 0) {
      doc.text(`CGST (${cgstRate}%):`, totalsX, yPosition);
      doc.text(`₹${cgstAmount.toLocaleString('en-IN')}`, 170, yPosition);
      yPosition += 6;

      doc.text(`SGST (${sgstRate}%):`, totalsX, yPosition);
      doc.text(`₹${sgstAmount.toLocaleString('en-IN')}`, 170, yPosition);
      yPosition += 6;
    }

    if (order.shipping && order.shipping > 0) {
      doc.text('Shipping:', totalsX, yPosition);
      doc.text(`₹${order.shipping.toLocaleString('en-IN')}`, 170, yPosition);
      yPosition += 6;
    }

    // Total line
    addLine(140, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', totalsX, yPosition);
    doc.text(`₹${order.totalAmount.toLocaleString('en-IN')}`, 170, yPosition);
    yPosition += 10;

    // Amount in words
    const amountInWords = this.numberToWords(order.totalAmount);
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount in Words: ${amountInWords} Rupees Only`, 20, yPosition);
    yPosition += 15;

    // Payment Information
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Payment Information:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition = addText(`Payment Method: ${order.paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}`, 20, yPosition);
    yPosition = addText(`Payment Status: ${order.paymentStatus}`, 20, yPosition);
    if (order.paymentOrderId) {
      yPosition = addText(`Payment ID: ${order.paymentOrderId}`, 20, yPosition);
    }

    // Terms and Conditions
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    yPosition = addText('Terms & Conditions:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    yPosition = addText('1. Goods once sold will not be taken back or exchanged.', 20, yPosition);
    yPosition = addText('2. All disputes are subject to Mumbai jurisdiction only.', 20, yPosition);
    yPosition = addText('3. This is a computer generated invoice and does not require signature.', 20, yPosition);

    // Footer
    yPosition = pageHeight - 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  }

  // Convert number to words (Indian format)
  private static numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertHundreds = (n: number): string => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };

    if (num === 0) return 'Zero';

    let result = '';
    const crores = Math.floor(num / 10000000);
    if (crores > 0) {
      result += convertHundreds(crores) + 'Crore ';
      num %= 10000000;
    }

    const lakhs = Math.floor(num / 100000);
    if (lakhs > 0) {
      result += convertHundreds(lakhs) + 'Lakh ';
      num %= 100000;
    }

    const thousands = Math.floor(num / 1000);
    if (thousands > 0) {
      result += convertHundreds(thousands) + 'Thousand ';
      num %= 1000;
    }

    if (num > 0) {
      result += convertHundreds(num);
    }

    return result.trim();
  }

  // Generate invoice filename
  static generateInvoiceFilename(order: Order): string {
    const date = new Date().toISOString().split('T')[0];
    const orderNumber = order.confirmationNumber || order.id.substring(0, 8);
    return `invoice-${orderNumber}-${date}.pdf`;
  }
}