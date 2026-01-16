// Wishlist notification service for price drops and stock availability
import { getClient, client } from '@/lib/amplify-client';
import type { WishlistItem, Product } from '@/types';

export interface WishlistNotification {
  id: string;
  customerId: string;
  productId: string;
  type: 'price_drop' | 'back_in_stock' | 'special_offer';
  title: string;
  message: string;
  originalPrice?: number;
  newPrice?: number;
  isRead: boolean;
  createdAt: string;
}

export class WishlistNotificationService {
  // Check for price drops on wishlist items
  static async checkPriceDrops(customerId: string): Promise<WishlistNotification[]> {
    try {
      // Get user's wishlist items
      const wishlistResponse = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId }
        }
      });

      if (!wishlistResponse.data || wishlistResponse.data.length === 0) return [];

      const notifications: WishlistNotification[] = [];

      // Check each wishlist item for price changes in parallel
      const notificationPromises = wishlistResponse.data.map(async (wishlistItem) => {
        try {
          // Get current product data
          const productResponse = await client.models.Product.get({ id: wishlistItem.productId });
          
          if (productResponse.data) {
            const product = productResponse.data;
            
            // Check if we have a stored original price (this would be stored when item was added to wishlist)
            // For now, we'll simulate a price drop check
            const originalPrice = this.getStoredOriginalPrice(wishlistItem.id);
            
            if (originalPrice && product.price < originalPrice) {
              const discount = ((originalPrice - product.price) / originalPrice * 100).toFixed(0);
              
              return {
                id: `price_drop_${wishlistItem.id}_${Date.now()}`,
                customerId,
                productId: wishlistItem.productId,
                type: 'price_drop' as const,
                title: 'Price Drop Alert!',
                message: `${product.name} is now ${discount}% off! Price dropped from ₹${originalPrice} to ₹${product.price}`,
                originalPrice,
                newPrice: product.price,
                isRead: false,
                createdAt: new Date().toISOString()
              };
            }
          }
        } catch (error) {
          console.error(`Error checking price for product ${wishlistItem.productId}:`, error);
        }
        return null;
      });

      const results = await Promise.all(notificationPromises);
      return results.filter((notif): notif is WishlistNotification => notif !== null);
    } catch (error) {
      console.error('Error checking price drops:', error);
      return [];
    }
  }

  // Check for stock availability on wishlist items
  static async checkStockAvailability(customerId: string): Promise<WishlistNotification[]> {
    try {
      // Get user's wishlist items
      const wishlistResponse = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId }
        }
      });

      if (!wishlistResponse.data) return [];

      const notifications: WishlistNotification[] = [];

      // Check each wishlist item for stock availability
      // COMMENTED OUT - Check each wishlist item for stock availability - Not needed for now
      /*
      for (const wishlistItem of wishlistResponse.data) {
        try {
          // Get current inventory data
          const inventoryResponse = await client.models.InventoryItem.list({
            filter: {
              productId: { eq: wishlistItem.productId }
            }
          });

          if (inventoryResponse.data && inventoryResponse.data.length > 0) {
            const inventory = inventoryResponse.data[0];
            
            // Check if item was previously out of stock and is now available
            const wasOutOfStock = this.getStoredStockStatus(wishlistItem.id);
            
            if (wasOutOfStock && inventory.stockQuantity > (inventory.reservedQuantity || 0)) {
              const availableQuantity = inventory.stockQuantity - (inventory.reservedQuantity || 0);
              
              // Get product name
              const productResponse = await client.models.Product.get({ id: wishlistItem.productId });
              const productName = productResponse.data?.name || 'Product';
              
              notifications.push({
                id: `back_in_stock_${wishlistItem.id}_${Date.now()}`,
                customerId,
                productId: wishlistItem.productId,
                type: 'back_in_stock',
                title: 'Back in Stock!',
                message: `${productName} is now available! Only ${availableQuantity} left in stock.`,
                isRead: false,
                createdAt: new Date().toISOString()
              });

              // Update stored stock status
              this.updateStoredStockStatus(wishlistItem.id, true);
            } else if (!wasOutOfStock && inventory.stockQuantity <= (inventory.reservedQuantity || 0)) {
              // Update stored stock status to out of stock
              this.updateStoredStockStatus(wishlistItem.id, false);
            }
          }
        } catch (error) {
          console.error(`Error checking stock for product ${wishlistItem.productId}:`, error);
        }
      }
      */

      // For now, return empty notifications since we don't have inventory tracking

      return notifications;
    } catch (error) {
      console.error('Error checking stock availability:', error);
      return [];
    }
  }

  // Generate special offer notifications for wishlist items
  static async generateSpecialOffers(customerId: string): Promise<WishlistNotification[]> {
    try {
      // Get user's wishlist items
      const wishlistResponse = await client.models.Wishlist.list({
        filter: {
          customerId: { eq: customerId }
        }
      });

      if (!wishlistResponse.data || wishlistResponse.data.length === 0) return [];

      // Generate special offers in parallel
      const notificationPromises = wishlistResponse.data.map(async (wishlistItem) => {
        try {
          // Get product data
          const productResponse = await client.models.Product.get({ id: wishlistItem.productId });
          
          if (productResponse.data) {
            const product = productResponse.data;
            
            // Example: Generate special offer for items in wishlist for more than 7 days
            const addedDate = new Date(wishlistItem.createdAt);
            const daysSinceAdded = Math.floor((Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysSinceAdded >= 7 && Math.random() > 0.7) { // 30% chance of special offer
              return {
                id: `special_offer_${wishlistItem.id}_${Date.now()}`,
                customerId,
                productId: wishlistItem.productId,
                type: 'special_offer' as const,
                title: 'Special Offer Just for You!',
                message: `Get 10% off on ${product.name}! Use code WISHLIST10 at checkout.`,
                isRead: false,
                createdAt: new Date().toISOString()
              };
            }
          }
        } catch (error) {
          console.error(`Error generating special offer for product ${wishlistItem.productId}:`, error);
        }
        return null;
      });

      const results = await Promise.all(notificationPromises);
      return results.filter((notif): notif is WishlistNotification => notif !== null);
    } catch (error) {
      console.error('Error generating special offers:', error);
      return [];
    }
  }

  // Get all notifications for a user
  static async getAllNotifications(customerId: string): Promise<WishlistNotification[]> {
    try {
      const [priceDrops, stockAlerts, specialOffers] = await Promise.all([
        this.checkPriceDrops(customerId),
        this.checkStockAvailability(customerId),
        this.generateSpecialOffers(customerId)
      ]);

      return [...priceDrops, ...stockAlerts, ...specialOffers]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting all notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    // In a real implementation, this would update the notification in the database
    // For now, we'll store it in localStorage
    const readNotifications = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId);
      localStorage.setItem('read_notifications', JSON.stringify(readNotifications));
    }
  }

  // Helper methods for storing/retrieving price and stock status
  // In a real implementation, these would be stored in the database
  private static getStoredOriginalPrice(wishlistItemId: string): number | null {
    const storedPrices = JSON.parse(localStorage.getItem('wishlist_original_prices') || '{}');
    return storedPrices[wishlistItemId] || null;
  }

  private static storeOriginalPrice(wishlistItemId: string, price: number): void {
    const storedPrices = JSON.parse(localStorage.getItem('wishlist_original_prices') || '{}');
    storedPrices[wishlistItemId] = price;
    localStorage.setItem('wishlist_original_prices', JSON.stringify(storedPrices));
  }

  private static getStoredStockStatus(wishlistItemId: string): boolean {
    const storedStatus = JSON.parse(localStorage.getItem('wishlist_stock_status') || '{}');
    return storedStatus[wishlistItemId] !== undefined ? storedStatus[wishlistItemId] : true; // Default to in stock
  }

  private static updateStoredStockStatus(wishlistItemId: string, inStock: boolean): void {
    const storedStatus = JSON.parse(localStorage.getItem('wishlist_stock_status') || '{}');
    storedStatus[wishlistItemId] = inStock;
    localStorage.setItem('wishlist_stock_status', JSON.stringify(storedStatus));
  }

  // Store original price when item is added to wishlist
  static storeOriginalPriceOnAdd(wishlistItemId: string, price: number): void {
    this.storeOriginalPrice(wishlistItemId, price);
  }

  // Initialize stock status when item is added to wishlist
  static initializeStockStatus(wishlistItemId: string, inStock: boolean): void {
    this.updateStoredStockStatus(wishlistItemId, inStock);
  }
}