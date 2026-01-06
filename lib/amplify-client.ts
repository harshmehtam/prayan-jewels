// Amplify client configuration and utilities
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import type { Schema } from '@/amplify/data/resource';

// Ensure Amplify is configured (especially for server-side usage)
if (!Amplify.getConfig().Auth?.Cognito) {
  Amplify.configure(outputs, { ssr: true });
}

// Generate the typed client for GraphQL operations
export const client = generateClient<Schema>();

// Generate a client specifically for guest/public access using IAM
export const guestClient = generateClient<Schema>({
  authMode: 'iam'
});

// Generate a client specifically for authenticated users
export const userClient = generateClient<Schema>({
  authMode: 'userPool'
});

/**
 * Simple auth mode check without React hooks
 */
const getAuthMode = async (): Promise<'userPool' | 'iam'> => {
  try {
    await getCurrentUser();
    return 'userPool';
  } catch (error) {
    return 'iam';
  }
};

/**
 * Get the appropriate client based on authentication status
 */
export const getDynamicClient = async () => {
  const authMode = await getAuthMode();
  return authMode === 'userPool' ? userClient : guestClient;
};

// Type exports for use throughout the application
export type AmplifyClient = typeof client;
export type { Schema };

// Helper function to handle Amplify errors
export function handleAmplifyError(error: any): string {
  if (error?.errors && Array.isArray(error.errors)) {
    return error.errors.map((e: any) => e.message).join(', ');
  }
  return error?.message || 'An unexpected error occurred';
}

// Helper function to calculate available inventory
export function calculateAvailableInventory(stockQuantity: number, reservedQuantity: number): number {
  return Math.max(0, stockQuantity - reservedQuantity);
}

// Helper function to format currency
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Helper function to generate session ID for guest carts
export function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Helper function to calculate cart totals
export function calculateCartTotals(items: Array<{ quantity: number; unitPrice: number }>) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const estimatedTax = subtotal * 0.18; // 18% GST for India
  const estimatedShipping = subtotal > 2000 ? 0 : 100; // Free shipping above ₹2000
  const estimatedTotal = subtotal + estimatedTax + estimatedShipping;

  return {
    subtotal,
    estimatedTax,
    estimatedShipping,
    estimatedTotal,
  };
}

// Helper function to validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate phone number (Indian format)
export function isValidPhoneNumber(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid 10-digit Indian mobile number (6-9 as first digit)
  if (cleanPhone.length === 10) {
    return /^[6-9]\d{9}$/.test(cleanPhone);
  }
  
  // Check if it's a valid 12-digit number with country code 91
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    const number = cleanPhone.slice(2);
    return /^[6-9]\d{9}$/.test(number);
  }
  
  // Check if it's already in E.164 format (+919999999999)
  if (phone.startsWith('+91') && cleanPhone.length === 12) {
    const number = cleanPhone.slice(2);
    return /^[6-9]\d{9}$/.test(number);
  }
  
  return false;
}

// Helper function to validate postal code (Indian format)
export function isValidPostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^[1-9][0-9]{5}$/;
  return postalCodeRegex.test(postalCode);
}