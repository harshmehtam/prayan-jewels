// API route for admin dashboard statistics
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { AdminUserService } from '@/lib/services/admin-users';
import { client } from '@/lib/amplify-client';

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    
    // Get user statistics
    const userStats = await AdminUserService.getUserStatistics();
    
    // Get order statistics
    const ordersResponse = await client.models.Order.list({
      limit: 1000, // Adjust as needed
    });
    
    const orders = ordersResponse.data || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const orderStats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      processingOrders: orders.filter(o => o.status === 'processing').length,
      shippedOrders: orders.filter(o => o.status === 'shipped').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      recentOrders: orders.filter(o => new Date(o.createdAt) > thirtyDaysAgo).length,
      totalRevenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      monthlyRevenue: orders
        .filter(o => o.status !== 'cancelled' && new Date(o.createdAt) > thirtyDaysAgo)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };
    
    // Get product statistics
    const productsResponse = await client.models.Product.list({
      limit: 1000, // Adjust as needed
    });
    
    const products = productsResponse.data || [];
    const productStats = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      inactiveProducts: products.filter(p => !p.isActive).length,
    };
    
    // Get inventory statistics (if inventory items exist)
    let inventoryStats = {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
    };
    
    try {
      const inventoryResponse = await client.models.InventoryItem.list({
        limit: 1000,
      });
      
      const inventory = inventoryResponse.data || [];
      inventoryStats = {
        totalItems: inventory.length,
        lowStockItems: inventory.filter(i => 
          i.stockQuantity <= (i.reorderPoint || 5) && i.stockQuantity > 0
        ).length,
        outOfStockItems: inventory.filter(i => i.stockQuantity <= 0).length,
      };
    } catch (inventoryError) {
      console.warn('Could not fetch inventory statistics:', inventoryError);
    }
    
    return NextResponse.json({
      users: userStats,
      orders: orderStats,
      products: productStats,
      inventory: inventoryStats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/dashboard:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}