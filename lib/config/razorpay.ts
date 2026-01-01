// Razorpay configuration and validation

export const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  publicKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  isTestMode: process.env.NODE_ENV === 'development' || process.env.RAZORPAY_TEST_MODE === 'true',
};

export function validateRazorpayConfig(requireWebhook: boolean = false) {
  const errors: string[] = [];

  if (!razorpayConfig.keyId) {
    errors.push('RAZORPAY_KEY_ID is not configured');
  }

  if (!razorpayConfig.keySecret) {
    errors.push('RAZORPAY_KEY_SECRET is not configured');
  }

  // Only require webhook secret if explicitly requested and not in test mode
  if (requireWebhook && !razorpayConfig.isTestMode && !razorpayConfig.webhookSecret) {
    errors.push('RAZORPAY_WEBHOOK_SECRET is not configured (required for production webhooks)');
  }

  if (!razorpayConfig.publicKeyId) {
    errors.push('NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured');
  }

  if (errors.length > 0) {
    throw new Error(`Razorpay configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}

export function validateRazorpayBasicConfig() {
  const errors: string[] = [];

  if (!razorpayConfig.keyId) {
    errors.push('RAZORPAY_KEY_ID is not configured');
  }

  if (!razorpayConfig.keySecret) {
    errors.push('RAZORPAY_KEY_SECRET is not configured');
  }

  if (!razorpayConfig.publicKeyId) {
    errors.push('NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured');
  }

  if (errors.length > 0) {
    throw new Error(`Razorpay basic configuration errors:\n${errors.join('\n')}`);
  }

  return true;
}

export function isRazorpayConfigured(): boolean {
  try {
    validateRazorpayBasicConfig();
    return true;
  } catch {
    return false;
  }
}

export function isWebhookConfigured(): boolean {
  return !!razorpayConfig.webhookSecret;
}