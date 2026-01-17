/**
 * Order utility functions shared across the application
 */

/**
 * Get CSS classes for order status badge
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get user-friendly status message for an order
 */
export function getOrderStatusMessage(order: {
  status?: string | null;
  trackingNumber?: string | null;
}): string {
  switch (order.status) {
    case 'pending':
      return 'Your order is being processed';
    case 'processing':
      return 'Order confirmed and being prepared';
    case 'shipped':
      return order.trackingNumber 
        ? `Shipped - Tracking: ${order.trackingNumber}` 
        : 'Your order has been shipped';
    case 'delivered':
      return 'Order delivered successfully';
    case 'cancelled':
      return 'Order was cancelled';
    default:
      return 'Order status unknown';
  }
}

/**
 * Format order number for display
 */
export function formatOrderNumber(order: {
  confirmationNumber?: string | null;
  id: string;
}): string {
  return order.confirmationNumber || `#${order.id.slice(-8)}`;
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format date for order display
 */
export function formatOrderDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(paymentMethod: string): string {
  return paymentMethod === 'cash_on_delivery' ? 'COD' : 'Online Payment';
}
