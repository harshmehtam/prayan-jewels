// MSG91 SMS service for order confirmations and notifications
interface MSG91Config {
  authKey: string;
  senderId: string;
}

interface SendSMSResponse {
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
}

export class MSG91NotificationService {
  private static config: MSG91Config = {
    authKey: process.env.MSG91_AUTH_KEY || '',
    senderId: process.env.MSG91_SENDER_ID || 'PRAYAN',
  };

  /**
   * Send order confirmation SMS
   */
  static async sendOrderConfirmation(
    phoneNumber: string,
    orderNumber: string,
    amount: number
  ): Promise<SendSMSResponse> {
    const message = `Dear Customer, your order ${orderNumber} for ₹${amount} has been confirmed. Thank you for shopping with Prayan Jewels!`;
    
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send order shipped notification
   */
  static async sendShippingNotification(
    phoneNumber: string,
    orderNumber: string,
    trackingNumber: string
  ): Promise<SendSMSResponse> {
    const message = `Your order ${orderNumber} has been shipped! Track your package with ${trackingNumber}. - Prayan Jewels`;
    
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send order delivered notification
   */
  static async sendDeliveryNotification(
    phoneNumber: string,
    orderNumber: string
  ): Promise<SendSMSResponse> {
    const message = `Your order ${orderNumber} has been delivered! Thank you for choosing Prayan Jewels. Rate your experience!`;
    
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send generic SMS
   */
  private static async sendSMS(phoneNumber: string, message: string): Promise<SendSMSResponse> {
    try {
      // Format phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': this.config.authKey,
        },
        body: JSON.stringify({
          sender: this.config.senderId,
          message: message,
          mobiles: formattedPhone,
          route: 4, // Transactional route
        }),
      });

      const data = await response.json();

      if (response.ok && data.type === 'success') {
        return {
          success: true,
          requestId: data.request_id,
          message: 'SMS sent successfully',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to send SMS',
        };
      }
    } catch (error) {
      console.error('MSG91 Send SMS Error:', error);
      return {
        success: false,
        error: 'Network error while sending SMS',
      };
    }
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      const number = cleanPhone.slice(2);
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
    return phoneNumber;
  }
}