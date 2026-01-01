// Amplify client configuration and utilities
import '@/lib/amplify-config'; // Ensure Amplify is configured
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// Generate the typed client for GraphQL operations
export const client = generateClient<Schema>();

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
  const phoneRegex = /^[+]?[91]?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Helper function to validate postal code (Indian format)
export function isValidPostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^[1-9][0-9]{5}$/;
  return postalCodeRegex.test(postalCode);
}