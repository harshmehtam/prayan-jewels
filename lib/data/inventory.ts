// Inventory data access layer
import { client, handleAmplifyError, calculateAvailableInventory } from '@/lib/amplify-client';
import type { InventoryItem } from '@/types';

export class InventoryService {
  // Get inventory for a specific product
  static async getProductInventory(productId: string) {
    try {
      const response = await client.models.InventoryItem.list({
        filter: {
          productId: { eq: productId }
        }
      });

      const inventoryItem = response.data?.[0];
      if (inventoryItem) {
        const availableQuantity = calculateAvailableInventory(
          inventoryItem.stockQuantity || 0,
          inventoryItem.reservedQuantity || 0
        );

        return {
          inventory: {
            ...inventoryItem,
            availableQuantity
          },
          errors: response.errors
        };
      }

      return {
        inventory: null,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Create inventory record for a product
  static async createInventory(productId: string, stockQuantity: number, reorderPoint: number = 5) {
    try {
      const response = await client.models.InventoryItem.create({
        productId,
        stockQuantity,
        reservedQuantity: 0,
        reorderPoint,
        lastRestocked: new Date().toISOString()
      });

      return {
        inventory: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Update stock quantity
  static async updateStock(productId: string, newStockQuantity: number) {
    try {
      // First, find the inventory item
      const inventoryResponse = await this.getProductInventory(productId);
      
      if (!inventoryResponse.inventory) {
        throw new Error('Inventory record not found for product');
      }

      const response = await client.models.InventoryItem.update({
        id: inventoryResponse.inventory.id,
        stockQuantity: newStockQuantity,
        lastRestocked: new Date().toISOString()
      });

      return {
        inventory: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Reserve inventory during checkout
  static async reserveInventory(productId: string, quantity: number) {
    try {
      const inventoryResponse = await this.getProductInventory(productId);
      
      if (!inventoryResponse.inventory) {
        throw new Error('Inventory record not found for product');
      }

      const inventory = inventoryResponse.inventory;
      const availableQuantity = calculateAvailableInventory(
        inventory.stockQuantity || 0,
        inventory.reservedQuantity || 0
      );

      if (availableQuantity < quantity) {
        throw new Error('Insufficient inventory available');
      }

      const response = await client.models.InventoryItem.update({
        id: inventory.id,
        reservedQuantity: (inventory.reservedQuantity || 0) + quantity
      });

      return {
        inventory: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Release reserved inventory (on payment failure or cancellation)
  static async releaseReservedInventory(productId: string, quantity: number) {
    try {
      const inventoryResponse = await this.getProductInventory(productId);
      
      if (!inventoryResponse.inventory) {
        throw new Error('Inventory record not found for product');
      }

      const inventory = inventoryResponse.inventory;
      const newReservedQuantity = Math.max(0, (inventory.reservedQuantity || 0) - quantity);

      const response = await client.models.InventoryItem.update({
        id: inventory.id,
        reservedQuantity: newReservedQuantity
      });

      return {
        inventory: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Confirm inventory (convert reserved to sold)
  static async confirmInventory(productId: string, quantity: number) {
    try {
      const inventoryResponse = await this.getProductInventory(productId);
      
      if (!inventoryResponse.inventory) {
        throw new Error('Inventory record not found for product');
      }

      const inventory = inventoryResponse.inventory;
      const newStockQuantity = (inventory.stockQuantity || 0) - quantity;
      const newReservedQuantity = Math.max(0, (inventory.reservedQuantity || 0) - quantity);

      const response = await client.models.InventoryItem.update({
        id: inventory.id,
        stockQuantity: Math.max(0, newStockQuantity),
        reservedQuantity: newReservedQuantity
      });

      return {
        inventory: response.data,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Get low stock items
  static async getLowStockItems() {
    try {
      const response = await client.models.InventoryItem.list();
      
      const lowStockItems = response.data?.filter(item => {
        const availableQuantity = calculateAvailableInventory(
          item.stockQuantity || 0,
          item.reservedQuantity || 0
        );
        return availableQuantity <= (item.reorderPoint || 5);
      }) || [];

      return {
        items: lowStockItems,
        errors: response.errors
      };
    } catch (error) {
      throw new Error(handleAmplifyError(error));
    }
  }

  // Check if product is in stock
  static async isProductInStock(productId: string, requestedQuantity: number = 1) {
    try {
      const inventoryResponse = await this.getProductInventory(productId);
      
      if (!inventoryResponse.inventory) {
        return false;
      }

      const availableQuantity = calculateAvailableInventory(
        inventoryResponse.inventory.stockQuantity || 0,
        inventoryResponse.inventory.reservedQuantity || 0
      );

      return availableQuantity >= requestedQuantity;
    } catch (error) {
      return false;
    }
  }
}