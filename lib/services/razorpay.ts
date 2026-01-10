import type { CreateOrderInput } from '@/types';

// Razorpay types (since @types/razorpay doesn't exist)
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

export class RazorpayService {
  private static instance: RazorpayService;
  private isScriptLoaded = false;

  private constructor() {}

  static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  // Load Razorpay script dynamically
  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isScriptLoaded && window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      document.head.appendChild(script);
    });
  }

  // Create order on server
  async createOrder(orderData: CreateOrderInput) {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Verify payment on server
  async verifyPayment(paymentData: RazorpayResponse & { orderId: string }) {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Open Razorpay checkout
  async openCheckout(options: {
    orderData: CreateOrderInput;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    onSuccess: (orderId: string, paymentId: string, confirmationNumber?: string) => void;
    onError: (error: Error) => void;
    onDismiss?: () => void;
  }): Promise<void> {
    try {
      // Load Razorpay script
      await this.loadRazorpayScript();

      // Create order on server
      const orderResponse = await this.createOrder(options.orderData);

      if (!orderResponse.success) {
        throw new Error('Failed to create payment order');
      }

      console.log('Opening Razorpay checkout modal for order:', orderResponse.orderId);

      // Configure Razorpay options
      const razorpayOptions: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderResponse.razorpayOrder.amount,
        currency: orderResponse.razorpayOrder.currency,
        name: 'Silver Mangalsutra Store',
        description: 'Purchase of silver mangalsutra jewelry',
        order_id: orderResponse.razorpayOrder.id,
        handler: async (response: RazorpayResponse) => {
          try {
            console.log('Payment successful, verifying...', response);
            
            // Verify payment on server
            const verificationResult = await this.verifyPayment({
              ...response,
              orderId: orderResponse.orderId,
            });

            if (verificationResult.success) {
              options.onSuccess(orderResponse.orderId, response.razorpay_payment_id, verificationResult.confirmationNumber);
            } else {
              options.onError(new Error('Payment verification failed'));
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            options.onError(error as Error);
          }
        },
        prefill: {
          name: options.customerName,
          email: options.customerEmail,
          contact: options.customerPhone,
        },
        notes: {
          orderId: orderResponse.orderId,
          customerId: options.orderData.customerId,
        },
        theme: {
          color: '#3B82F6', // Blue theme
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal dismissed');
            if (options.onDismiss) {
              options.onDismiss();
            }
          },
        },
      };

      console.log('Opening Razorpay checkout modal...');
      // Open Razorpay checkout
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();

    } catch (error) {
      console.error('Error opening Razorpay checkout:', error);
      options.onError(error as Error);
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId: string) {
    try {
      // This would typically call Razorpay API to get payment status
      // For now, we'll implement a simple status check
      const response = await fetch(`/api/razorpay/payment-status?paymentId=${paymentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }
}