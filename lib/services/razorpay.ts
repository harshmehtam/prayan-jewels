import Razorpay from 'razorpay';
import crypto from 'crypto';
import { validateRazorpayBasicConfig } from '@/lib/config/razorpay';

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/**
 * Get Razorpay client instance (server-side only)
 */
function getRazorpayClient(): Razorpay {
  validateRazorpayBasicConfig();
  
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

/**
 * Calculate order totals
 */
export function calculateOrderTotals(items: Array<{ quantity: number; unitPrice: number }>, couponDiscount: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.18; // 18% GST
  const shipping = subtotal > 2000 ? 0 : 100; // Free shipping above ₹2000
  const totalAmount = subtotal + tax + shipping - couponDiscount;

  return {
    subtotal,
    tax,
    shipping,
    totalAmount,
  };
}

/**
 * Create Razorpay order (server-side only)
 */
export async function createRazorpayOrder(
  amount: number,
  customerId: string,
  itemCount: number
): Promise<{ success: boolean; order?: Record<string, unknown>; error?: string }> {
  try {
    const razorpay = getRazorpayClient();

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        customerId,
        totalAmount: amount.toString(),
        itemCount: itemCount.toString(),
      },
    });

    return {
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
    };
  } catch (error) {
    let errorMessage = 'Failed to create payment order';
    
    if (error instanceof Error) {
      if (error.message.includes('key_id')) {
        errorMessage = 'Razorpay configuration error: Invalid key ID';
      } else if (error.message.includes('key_secret')) {
        errorMessage = 'Razorpay configuration error: Invalid key secret';
      } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        errorMessage = 'Network error: Unable to connect to Razorpay servers';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify Razorpay payment signature (server-side only)
 */
export async function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    validateRazorpayBasicConfig();

    // Verify payment signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return {
        success: false,
        error: 'Invalid payment signature',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed',
    };
  }
}

/**
 * Get payment status from Razorpay (server-side only)
 */
export async function getPaymentStatus(paymentId: string): Promise<{ success: boolean; payment?: Record<string, unknown>; error?: string }> {
  try {
    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(paymentId);

    return {
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: payment.created_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment status',
    };
  }
}

// Client-side functions

let isScriptLoaded = false;

/**
 * Load Razorpay script dynamically (client-side only)
 */
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isScriptLoaded && window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      isScriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay script'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Open Razorpay checkout modal (client-side only)
 */
export function openRazorpayCheckout(options: {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId: string;
  onSuccess: (response: RazorpayResponse) => void;
  onError: (error: Error) => void;
  onDismiss?: () => void;
}): void {
  if (!window.Razorpay) {
    options.onError(new Error('Razorpay script not loaded'));
    return;
  }

  const razorpayOptions: RazorpayOptions = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    amount: options.amount,
    currency: options.currency,
    name: 'Prayan Jewels',
    description: 'Purchase of jewelry',
    order_id: options.orderId,
    handler: options.onSuccess,
    prefill: {
      name: options.customerName,
      email: options.customerEmail,
      contact: options.customerPhone,
    },
    notes: {
      customerId: options.customerId,
    },
    theme: {
      color: '#3B82F6',
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
    },
  };

  const razorpay = new window.Razorpay(razorpayOptions);
  razorpay.open();
}