// Price utility functions for handling selling price, actual price, and discounts

export interface PriceInfo {
  sellingPrice: number;
  actualPrice?: number | null;
  hasDiscount: boolean;
  discountPercentage: number;
  discountAmount: number;
}

/**
 * Calculate price information including discount percentage and amount
 */
export function calculatePriceInfo(sellingPrice: number, actualPrice?: number | null): PriceInfo {
  const hasDiscount = !!(actualPrice && actualPrice > sellingPrice);
  
  if (!hasDiscount) {
    return {
      sellingPrice,
      actualPrice,
      hasDiscount: false,
      discountPercentage: 0,
      discountAmount: 0,
    };
  }

  const discountAmount = actualPrice! - sellingPrice;
  const discountPercentage = Math.round((discountAmount / actualPrice!) * 100);

  return {
    sellingPrice,
    actualPrice,
    hasDiscount: true,
    discountPercentage,
    discountAmount,
  };
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format price without currency symbol (for display purposes)
 */
export function formatPriceNumber(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Get discount badge text
 */
export function getDiscountBadgeText(discountPercentage: number): string {
  return `${discountPercentage}% OFF`;
}

/**
 * Validate price inputs (ensure selling price is not higher than actual price)
 */
export function validatePrices(sellingPrice: number, actualPrice?: number | null): {
  isValid: boolean;
  error?: string;
} {
  if (sellingPrice < 0) {
    return {
      isValid: false,
      error: 'Selling price cannot be negative',
    };
  }

  if (actualPrice !== null && actualPrice !== undefined) {
    if (actualPrice < 0) {
      return {
        isValid: false,
        error: 'Actual price cannot be negative',
      };
    }

    if (actualPrice > 0 && sellingPrice > actualPrice) {
      return {
        isValid: false,
        error: 'Selling price cannot be higher than actual price',
      };
    }
  }

  return { isValid: true };
}